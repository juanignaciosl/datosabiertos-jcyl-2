function query(query, successCallback, errorCallback) {
  var url = 'http://juanignaciosl.cartodb.com/api/v2/sql';
  $.ajax({
    type: 'GET',
    url: url,
    crossDomain: true,
    data: { q: query },
    dataType: 'json',
    success: function(responseData, textStatus, jqXHR) {
      successCallback(responseData);
    },
    error: function(responseData, textStatus, jqXHR) {
      errorCallback(responseData);
    }
  });
}
