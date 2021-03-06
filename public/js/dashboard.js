var dashboard = angular.module('dashboard', ['formApp', 'ngRoute']);

dashboard.config(function($routeProvider) {
  $routeProvider
    .when('/profile:id', {
      templateUrl: 'pages/dashboard/profile.html',
      controller: 'ProfileController'
    })
    .when('/pastride:id', {
      templateUrl: 'pages/dashboard/pastride.html',
      controller: 'PastrideController'
    })
    .when('/userID:id', {
      templateUrl: 'pages/dashboard/homepage.html',
    })
    .when('/service:id', {
      templateUrl: 'pages/dashboard/homepage.html',
      controller: 'ServiceController',
      redirectTo: '/userID:id'
    })
    .otherwise({
      redirectTo: '/userID:id',
      templateUrl: 'pages/dashboard/homepage.html',
    });
});
dashboard.factory('Data', function() {
  var data = {
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    role: '',
  };
  return {
    getData: function() {
      return data;
    },
    setData: function(newId, first, last, email, role) {
      data.id = newId;
      data.firstName = first;
      data.lastName = last;
      data.email = email;
      data.role = role;
    }
  };
})

dashboard.controller('HomepageController', function($scope, $location, $routeParams, $http, $timeout, Data) {
  var first = true;

  $timeout(function() {
    var str = $routeParams.id;
    if (!!str) {
      str = str.slice(1);
    }
    if (str != undefined) {
      console.log(str);
      if (first) {
        var a = document.getElementById('sidebar').getElementsByTagName('a'),
          length = a.length;
        var dropdown = document.getElementById('navbarResponsive').getElementsByTagName('a');
        var buttonRequest = document.getElementById('linkRequest');
        for (var i = 0; i < length; i++) {
          a[i].href += $routeParams.id;
          dropdown[i].href += $routeParams.id;
          console.log(dropdown[i].href);
          console.log(a[i].href);
        }
        dropdown[2].href += $routeParams.id;
        buttonRequest.href += $routeParams.id;
        first = false;
      }
      $scope.setUpName($scope, str);
    }
  }, 50);
  $scope.setUpName = function($scope, userID) {
    $scope.name = "";
    console.log(userID);
    $http({
      url: '/getID',
      method: 'GET',
      params: {
        id: userID
      }
    }).then(function(response) {
      console.log("posted successfully");
      Data.setData(userID, response.data[0].firstName, response.data[0].lastName, response.data[0].email, response.data[0].rider);
      console.log(Data.getData());
      $scope.name = response.data[0].firstName + " " + response.data[0].lastName;
      // $scope.password = response.data[0].password;
      $scope.phonenumber = response.data[0].phoneNumber;
      $scope.email = response.data[0].email;
      if (response.data[0].rider == 1) {
        $scope.role = "Rider";
        $scope.function = "REQUEST RIDE";
        $scope.serviceTitle = " Rider Mode: " + Data.getData().firstName;
      } else {
        $scope.role = "Driver";
        $scope.function = "START DRIVING";
        $scope.serviceTitle = " Driver Mode:  " + Data.getData().firstName;
      }
    }).catch(function(response) {
      console.log("Error when getting user's information");
    })
  };
});

dashboard.controller('ProfileController', function($scope, $http, Data, $timeout) {
  $timeout(function() {
    $scope.setUpPayment($scope, Data.getData().id);
    console.log(Data.getData().id);
  }, 50);
  $scope.setUpPayment = function($scope, userID) {
    console.log(userID);
    $http({
      url: '/getPayment',
      method: 'GET',
      params: {
        id: userID
      }
    }).then(function(response) {
      console.log(response.data[0]);
      $scope.type = response.data[0].type;
      num = response.data[0].cardNum.toString();
      $scope.cardnumber = "xxxx-xxxx-xxxx-" + num.slice(12, 16);
      $scope.month = response.data[0].expMonth;
      $scope.year = response.data[0].expYear;
      $scope.cardholder = response.data[0].name;

    }).catch(function(response) {
      console.log("something is wrong");
    })
  };

});


dashboard.controller('ServiceController', function($scope, $http, Data, $timeout) {
  $timeout(function() {
    var url = '';
    if ($scope.role == "Driver") {
      url = 'http://localhost:1600/drivermap#:' + Data.getData().id;
      // window.open(url, '_blank').focus();
      // $("#siteloader").html('<object data="http://localhost:1600/drivermap.html">');
      window.location.replace(url);
    } else {
      url = 'http://localhost:1600/ridermap#:' + Data.getData().id;
      // window.open(url, '_blank').focus();
      // $("#siteloader").html('<object data="http://localhost:1600/ridermap.html">');
      window.location.replace(url);

    }
  }, 100);
});

dashboard.controller('PastrideController', function($scope, $http, Data, $timeout) {
  $timeout(function() {
    $scope.getPastRides($scope, Data.getData().id, $scope.role);
    console.log(Data.getData().id);
  }, 200);
  $scope.getPastRides = function($scope, userID, role) {
    console.log(userID);
    $http({
      url: '/getPastrides' + role,
      method: 'GET',
      params: {
        id: userID
      }
    }).then(function(response) {
      console.log(response.data[0]);
      console.log(response.data.length);
      console.log("response in dashboardjs");
      console.log(response);
      $scope.driverName = response.data[0].driverName;
      $scope.riderName = response.data[0].riderName;
      $scope.price = response.data[0].cost;
      var startAddressPromise = getAddressFromLatLng(response.data[0].start_lat, response.data[0].start_long);
      startAddressPromise.then(function(result) {
        $scope.$apply(function() {
          $scope.startAddress = result;
        });
      });
      var endAddressPromise = getAddressFromLatLng(response.data[0].dest_lat, response.data[0].dest_long);
      endAddressPromise.then(function(result) {
        $scope.$apply(function() {
          $scope.endAddress = result;
          // $scope.driverName = response.data[0].driverName;
        });
      });

    }).catch(function(response) {
      console.log(response);
      console.log("something is wrong");
    })
  };
});

function getAddressFromLatLng(lat, lng) {
  var deferred = $.Deferred();
  $.ajax({
    url: 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' + lat + ',' + lng + '&key=AIzaSyCbwzfaOyI1NHYXHxO184YFUc0LhQQz7RE',
    method: 'POST',
    success: function(result, status) {
      var address = result.results[0].formatted_address;
      deferred.resolve(address);
    }
  });
  return deferred.promise();
}
