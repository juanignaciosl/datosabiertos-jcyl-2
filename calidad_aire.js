function calidadAire(parentId, chartCanvasParentId) {
  var id = parentId + '_';
  var mapContainer = $('#' + parentId);
  mapContainer.append('<div id="' + id + '" class="map"></div>');

  var chartCanvasId = chartCanvasParentId + '_';
  var chartLegendId = chartCanvasParentId + '_l';
  var chartContainer = $('#' + chartCanvasParentId);
  chartContainer.append("<div id='" + chartLegendId + "'></div>");
  chartContainer.append("<canvas id='" + chartCanvasId + "' width='800' height='250'></canvas>");

  queryYears(function(years) {
    var yearSelector = $('<div class="year-selector"></div>').appendTo(mapContainer);
    _.each(years, function(year) {
      $('<span class="year" id="year-' + year + '">' + year + '</span>').appendTo(yearSelector).on('click', function(e) {
        var year = e.currentTarget.innerText;
        loadMapYear(year);
      });
    });
    yearSelector.append('<span class="stretch"></span>');

    loadMap(_.last(years), function() {});
    loadChart(years, function() {});
  });

  function queryYears(callback) {
    query('SELECT distinct year FROM calidad_del_aire_cyl_anual_so2 order by year', 
      function(responseData) {
        callback(_.map(responseData.rows, function(row) {
          return row.year;
        }));
      });
  }

  var layers;

  function loadMap(year, callback) {
    var vizJson = 'http://team.cartodb.com/api/v2/viz/d298d60e-9eee-11e4-bc2e-0e0c41326911/viz.json';
    cartodb.createVis(id, vizJson).done(function(vis, theLayers) {
      layers = theLayers;
      //var map = vis.getNativeMap();
      loadMapYear(year);
    });

  }

  function loadMapYear(year) {
    mapContainer.find('.year').removeClass('selected');
    mapContainer.find('#year-' + year).addClass('selected');
    var sql = "select c.cartodb_id, p.the_geom_webmercator, initcap(p.nom_prov), c.year, c.avg from calidad_del_aire_cyl_anual_so2 c inner join spanish_provinces p on c.provincia = p.nom_prov and year = " + year;
    layers[1].getSubLayer(0).setSQL(sql);
  }

  function loadChart(years, callback) {
    var query = "select initcap(p.nom_prov) Provincia, c.year, c.avg from calidad_del_aire_cyl_anual_so2 c inner join spanish_provinces p on c.provincia = p.nom_prov order by year, Provincia";
    var sql = cartodb.SQL({ user: 'juanignaciosl' });
    sql.execute(query).done(function(data) {
      var rowsProvincias = _.groupBy(data.rows, function(row) {
        return row.provincia;
      });
      var rowsProvincias = _.map(rowsProvincias, function(rowsProvincia) {
        return _.map(years, function(year) {
          var yearRow = _.find(rowsProvincia, function(rowProvincia) {
            return rowProvincia.year == year;
          });
          return typeof yearRow === 'undefined' ? { year: year, avg: null } : yearRow;
        });
      });
      var dataProvincias = _.map(rowsProvincias, function(rowsProvincia) {
        return {
          label: _.find(rowsProvincia, function(rowProvincia) {
                   return typeof rowProvincia.provincia != 'undefined';
                 }).provincia,
          avgs: _.map(rowsProvincia, function(row) {
            return row.avg;
          })
        };
      });
      if(typeof dataProvincias.sort != 'undefined') {
        dataProvincias = dataProvincias.sort(function(a, b) {
          return a.label.localeCompare(b.label);
        });
      }
      var colors = [
        "rgba(220,220,120,0.5)",
        "rgba(120,220,120,0.5)",
        "rgba(20,220,120,0.5)",
        "rgba(220,220,120,0.5)",
        "rgba(220,120,120,0.5)",
        "rgba(220,20,120,0.5)",
        "rgba(220,220,120,0.5)",
        "rgba(220,220,220,0.5)",
        "rgba(220,220,20,0.5)"
      ];
      var datasets = _.map(dataProvincias, function(dataProvincia, i) {
          var avgsProvincia = dataProvincia.avgs;
          return {
            fillColor : colors[i],
            strokeColor : colors[i],
            pointColor : colors[i],
            pointStrokeColor : "#fff",
            data : avgsProvincia,
            label: dataProvincia.label
          };
      });
      var lineChartData = {
        labels : years,
        datasets :  datasets
      }

      legend(document.getElementById(chartLegendId), lineChartData);
      new Chart(document.getElementById(chartCanvasId).getContext("2d"))
        .Line(lineChartData);
    });
  }
}

function legend(parent, data) {
    parent.className = 'legend';
    var datas = data.hasOwnProperty('datasets') ? data.datasets : data;

    while(parent.hasChildNodes()) {
        parent.removeChild(parent.lastChild);
    }

    datas.forEach(function(d) {
        var title = document.createElement('span');
        title.className = 'title';
        parent.appendChild(title);

        var colorSample = document.createElement('div');
        colorSample.className = 'color-sample';
        colorSample.style.backgroundColor = d.hasOwnProperty('strokeColor') ? d.strokeColor : d.color;
        colorSample.style.borderColor = d.hasOwnProperty('fillColor') ? d.fillColor : d.color;
        title.appendChild(colorSample);

        var text = document.createTextNode(d.label);
        title.appendChild(text);
    });
}
