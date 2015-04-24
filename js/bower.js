(function () {
    var scripts = [
        'bower_components/jquery/dist/jquery.min.js',
        'bower_components/bootstrap/dist/js/bootstrap.min.js',
        'bower_components/flat-ui/dist/js/flat-ui.min.js',
        'bower_components/bootstrap-table/src/bootstrap-table.js',
        'bower_components/bootstrap-table/dist/extensions/flatJSON/bootstrap-table-flatJSON.min.js',
        'bower_components/select2/select2.min.js',
        'bower_components/momentjs/min/moment.min.js',
        'bower_components/sprintf/dist/sprintf.min.js',
        'bower_components/bootstrap-modal/js/bootstrap-modal.js',
        'bower_components/bootstrap-modal/js/bootstrap-modalmanager.js',
        'bower_components/textile-js/lib/textile.js',
        'bower_components/blueimp-md5/js/md5.min.js'
    ];

    for (var i = 0; i < scripts.length; i++) {
        document.write('<script src="' + scripts[i] + '"></script>');
    }
})();
