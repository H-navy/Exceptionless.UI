(function () {
  'use strict';

  angular.module('exceptionless.stack-trace', [
    'ngSanitize',

    'exceptionless',
    'exceptionless.error'
  ])
  .directive('stackTrace', function ($ExceptionlessClient, $sanitize, $sce, errorService) {
    function buildParameter(parameter) {
      var result = '';

      var parts = [];
      if (parameter.type_namespace) {
        parts.push(parameter.type_namespace);
      }

      if (parameter.type) {
        parts.push(parameter.type);
      }

      result += parts.join('.').replace('+', '.');

      if (!!parameter.generic_arguments && parameter.generic_arguments.length > 0) {
        result += '[' + parameter.generic_arguments.join(',') + ']';
      }

      if (parameter.name) {
        result += ' ' + parameter.name;
      }

      return result;
    }

    function buildParameters(parameters) {
      var result = '(';
      for (var index = 0; index < (parameters || []).length; index++) {
        if (index > 0) {
          result += ', ';
        }

        result += buildParameter(parameters[index]);
      }
      return result + ')';
    }

    function buildStackFrame(frame) {
      if (!frame) {
        return '<null>\r\n';
      }

      var typeNameParts = [];
      if (!!frame.declaring_namespace) {
        typeNameParts.push(frame.declaring_namespace);
      }

      if (!!frame.declaring_type) {
        typeNameParts.push(frame.declaring_type);
      }

      typeNameParts.push(frame.name || '<anonymous>');

      var result = 'at ' + typeNameParts.join('.').replace('+', '.');

      if (!!frame.generic_arguments && frame.generic_arguments.length > 0) {
        result += '[' + frame.generic_arguments.join(',') + ']';
      }

      result += buildParameters(frame.parameters);
      if (!!frame.data && (frame.data.ILOffset > 0 || frame.data.NativeOffset > 0)) {
        result += ' at offset ' + frame.data.ILOffset || frame.data.NativeOffset;
      }

      if (frame.file_name) {
        result += ' in ' + frame.file_name;
        if (frame.line_number > 0) {
          result += ':line ' + frame.line_number;
        }

        if (frame.column > 0) {
          result += ':col ' + frame.column;
        }
      }

      return escapeHTML(result + '\r\n');
    }

    function buildStackFrames(exceptions) {
      var frames = '';
      for (var index = 0; index < exceptions.length; index++) {
        var stackTrace = exceptions[index].stack_trace;
        if (!!stackTrace) {
          frames += '<div class="stack-frame">';

          for (var frameIndex = 0; frameIndex < stackTrace.length; frameIndex++) {
            frames += escapeHTML(buildStackFrame(stackTrace[frameIndex]));
          }

          if (index < (exceptions.length - 1)) {
            frames += '<div>--- End of inner exception stack trace ---</div>';
          }

          frames += '</div>';
        }
      }

      return frames;
    }

    function buildStackTrace(exceptions) {
      if (!exceptions) {
        return null;
      }

      return buildStackTraceHeader(exceptions) + buildStackFrames(exceptions.reverse());
    }

    function buildStackTraceHeader(exceptions) {
      var header = '';
      for (var index = 0; index < exceptions.length; index++) {
        header += '<span class="ex-header">';

        if (index > 0) {
          header += ' ---> ';
        }

        var hasType = !!exceptions[index].type;
        if (hasType) {
          header += '<span class="ex-type">' + escapeHTML(exceptions[index].type) + '</span>: ';
        }

        if (exceptions[index].message) {
          header += '<span class="ex-message">' + escapeHTML(exceptions[index].message) + '</span>';
        }

        if (hasType) {
          header += '</span>';
        }
      }

      return header;
    }

    function escapeHTML(input) {
      if (!input || !input.replace) {
        return input;
      }

      return $sce.trustAsHtml(input
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;"));
    }

    return {
      bindToController: true,
      restrict: 'E',
      replace: true,
      scope: {
        exception: "="
      },
      template: '<pre class="stack-trace"><code ng-bind-html="vm.stackTrace"></code></pre>',
      controller: [function () {
        var vm = this;
        this.$onInit = function $onInit() {
          vm.stackTrace = $sce.trustAsHtml(buildStackTrace(errorService.getExceptions(vm.exception)));
        };
      }],
      controllerAs: 'vm'
    };
  });
}());
