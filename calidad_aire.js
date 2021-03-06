var colors = [
  "rgba(220,220,120,0.5)",
  "rgba(120,220,120,0.5)",
  "rgba(20,220,120,0.5)",
  "rgba(220,220,120,0.5)",
  "rgba(220,120,120,0.5)",
  "rgba(220,20,120,0.5)",
  "rgba(220,220,120,0.5)",
  "rgba(220,220,220,0.5)",
  "rgba(220,220,20,0.5)",
  "rgba(120,120,20,0.5)"
];

function calidadAire(parentId, chartCanvasParentId, options) {
  var id = parentId + '_';
  var mapContainer = $('#' + parentId);
  mapContainer.append('<div id="' + id + '" class="map"></div>');

  var chartCanvasId = chartCanvasParentId + '_';
  var chartLegendId = chartCanvasParentId + '_l';
  var chartContainer = $('#' + chartCanvasParentId);
  chartContainer.append("<div id='" + chartLegendId + "'></div>");
  chartContainer.append("<canvas id='" + chartCanvasId + "' width='800' height='250'></canvas>");

  var vizJson = options.vizJson;
  var table = options.table;

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
    query("SELECT distinct year FROM " + table + " order by year", 
      function(responseData) {
        callback(_.map(responseData.rows, function(row) {
          return row.year;
        }));
      });
  }

  var layers;

  function loadMap(year, callback) {
    cartodb.createVis(id, vizJson).done(function(vis, theLayers) {
      layers = theLayers;
      //var map = vis.getNativeMap();
      loadMapYear(year);
    });

  }

  function loadMapYear(year) {
    mapContainer.find('.year').removeClass('selected');
    mapContainer.find('#year-' + year).addClass('selected');
    var sql = "select c.cartodb_id, p.the_geom_webmercator, initcap(p.nom_prov), c.year, c.avg from " + table + " c inner join spanish_provinces p on c.provincia = p.nom_prov and year = " + year;
    layers[1].getSubLayer(0).setSQL(sql);
  }

  function loadChart(years, callback) {
    var query = "select initcap(p.nom_prov) Provincia, c.year, c.avg from " + table + " c inner join spanish_provinces p on c.provincia = p.nom_prov order by year, Provincia";
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

function movimientoNatural(chartCanvasParentId, options) {
  var chartContainer = $('#' + chartCanvasParentId);

  var chartCanvasId = chartCanvasParentId + '_';
  var chartCanvasIdN = chartCanvasParentId + '_n';
  var chartCanvasIdD = chartCanvasParentId + '_d';
  var chartCanvasIdM = chartCanvasParentId + '_m';

  var chartLegendId = chartCanvasParentId + '_l';
  chartContainer.append("<div id='" + chartLegendId + "'></div>");
  
  var chartsContainer = $('<div class="charts-container"></div>').appendTo(chartContainer);
  chartsContainer.append('<h3>Nacimientos</h3>');
  chartsContainer.append("<canvas id='" + chartCanvasIdN + "' width='2000' height='250'></canvas>");
  chartsContainer.append('<h3>Defunciones</h3>');
  chartsContainer.append("<canvas id='" + chartCanvasIdD + "' width='2000' height='250'></canvas>");
  chartsContainer.append('<h3>Matrimonios</h3>');
  chartsContainer.append("<canvas id='" + chartCanvasIdM + "' width='2000' height='250'></canvas>");

  var table = options.table;
  query('select distinct ano from movimiento_natural_cyl order by ano', function(data) {
    var anhos = _.map(data.rows, function(row) {
      return row.ano;
    });

    query('select ano, p, n, d, m from movimiento_natural_cyl order by p, ano', function(data) {
      var row = data.rows;
      var rowsProvincias = _.groupBy(data.rows, function(row) {
        return row.p;
      });

      function datasets(column) {
        var i = 0;
        return _.map(rowsProvincias, function(rowsProvincia, p) {
          i++;
          return {
            label: rowsProvincia[0].p,
            fillColor: colors[i],
            strokeColor: colors[i],
            highlightFill: colors[i],
            highlightStroke: colors[i],
            data: _.map(rowsProvincia, function(rowProvincia) {
              return rowProvincia[column];
            })
          }
        });
      }

      var dataN = { labels: anhos, datasets: datasets('n') }
      var dataD = { labels: anhos, datasets: datasets('d') }
      var dataM = { labels: anhos, datasets: datasets('m') }

      var options = {};

      legend(document.getElementById(chartLegendId), dataN);
      new Chart(document.getElementById(chartCanvasIdN).getContext("2d")).Bar(dataN, options);
      new Chart(document.getElementById(chartCanvasIdD).getContext("2d")).Bar(dataD, options);
      new Chart(document.getElementById(chartCanvasIdM).getContext("2d")).Bar(dataM, options);

    });

  });
}
