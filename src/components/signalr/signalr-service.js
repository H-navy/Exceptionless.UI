﻿(function () {
  'use strict';

  angular.module('exceptionless.signalr', ['SignalR'])
    .factory('signalRService', ['$rootScope', '$timeout', '$log', 'Hub', '$auth', function ($rootScope, $timeout, $log, Hub, $auth) {
      var signalR;

      function startDelayed(baseUrl) {
        if (signalR)
          stop();

        signalR = $timeout(function () {
          var hub = new Hub('messages', {
            rootPath: baseUrl + '/push',

            // client side methods
            listeners: {
              'entityChanged': function (entityChanged) {
                $rootScope.$emit(entityChanged.type + 'Changed', entityChanged);
              },
              'eventOccurrence': function (eventOccurrence) {
                $rootScope.$emit('eventOccurrence', eventOccurrence);
              },
              'stackUpdated': function (stackUpdated) {
                $rootScope.$emit('stackUpdated', stackUpdated);
              },
              'planOverage': function (planOverage) {
                $rootScope.$emit('planOverage', planOverage);
              },
              'planChanged': function (planChanged) {
                $rootScope.$emit('planChanged', planChanged);
              }
            },

            queryParams: {
              'access_token': $auth.getToken()
            },

            // handle connection error
            errorHandler: function (error) {
              $log.error(error);
            }
          });
        }, 1000);
      }

      function stop() {
        if (!signalR)
          return;

        $timeout.cancel(signalR);
        signalR = null;
      }

      var service = {
        startDelayed: startDelayed,
        stop: stop
      };

      return service;
    }]);
}());