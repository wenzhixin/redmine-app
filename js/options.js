'use strict';

$(function () {
    var $url = $('#url');

    $url.val(localStorage['redmine-url']);

    $('form').submit(function () {
        return false;
    });

    $('#ok').click(function () {
        var url = $.trim($url.val());
        if (url.slice(-1) === '/') {
            url = url.substring(0, url.length - 1);
        }
        localStorage['redmine-url'] = url;
        alert('Save OK!');
        location.href = 'index.html';
    });
});