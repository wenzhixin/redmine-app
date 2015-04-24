'use strict';

$(function () {
    var $loading = $('#loading'),
        $settings = $('.settings'),
        $url = $('#url'),
        $key = $('#key'),
        $main = $('#main'),
        $status = $('#status'),
        $assignedToMe = $('#assignedToMe'),
        $table = $('#table'),
        $issue = $('#issue'),
        issueTpl = $('#issueTpl').html(),
        itemTpl = $('#itemTpl').html();

    window.models = {
        init: function (callback) {
            chrome.storage.local.get('redmine', function (obj) {
                if (obj.redmine) {
                    models.baseUrl = obj.redmine.url;
                    models.key = obj.redmine.key;
                    models.unreadList = obj.redmine.unreadList;
                }
                $url.val(models.baseUrl);
                $key.val(models.key);
                callback();
            });
        },
        baseUrl: '',
        key: '',
        unreadList: {},
        users: [],
        selections: []
    };

    window.formatter = {
        tracker: function (value, row) {
            var fa = {
                'Bug': 'fa fa-bug',
                'Feature': 'fa fa-thumbs-o-up',
                'Test': 'fa fa-wrench',
                'Task': 'fa fa-tasks',
                'Support': 'fa fa-support',
                'Review': 'fa fa-reply'
            };
            if (fa[value]) {
                value = sprintf('<span class="%s" title="%s" data-toggle="tooltip"></span>',
                    fa[value], value);
            }
            return sprintf('%s <a href="%s/issues/%s" target="_blank">#%s</a>',
                value, models.baseUrl, row.id, row.id);
        },
        status: function (value, row) {
            var priority = row['priority.name'];

            return sprintf('<span class="label label-%s" title="%s" data-toggle="tooltip">%s</span> %s',
                priority.toLowerCase(), priority, priority.slice(0, 1), value);
        },
        subject: function (value, row) {
            var author = formatter.avatar({
                    id: row['author.id'],
                    name: row['author.name']
                }),
                assigned = formatter.avatar({
                    id: row['assigned_to.id'],
                    name: row['assigned_to.name']
                });

            if (!row['assigned_to.id']) {
                return sprintf('<div>%s <span class="click-here">%s</span></div>', author, value);
            }
            return sprintf('<div>%s <span class="fa fa-angle-double-right"></span> %s <span class="click-here">%s</span></div>',
                author, assigned, value);
        },
        date: function (value) {
            return sprintf('<span title="%s" data-toggle="tooltip">%s</span>',
                moment(new Date(value)).format('YYYY-MM-DD HH:mm:ss'),
                moment(new Date(value)).fromNow());
        },
        avatar: function (user) {
            var img = '';
            $.each(models.users, function (i, u) {
                if (u.id === user.id) {
                    img = sprintf('http://www.gravatar.com/avatar/%s?rating=PG&size=48&default=wavatar',
                        md5(u.mail));
                    return false;
                }
                return true;
            });
            return sprintf('<img title="%s" class="avatar" data-src="%s" data-toggle="tooltip">',
                user.name, img);
        }
    };

    window.util = {
        getHeight: function () {
            return $(window).height();
        },
        updateStorage: function () {
            chrome.storage.local.set({
                redmine: {
                    url: models.baseUrl,
                    key: models.key,
                    unreadList: models.unreadList
                }
            });
        },
        markRead: function (issue) {
            models.unreadList[issue.id] = issue.updated_on;
            util.updateStorage();
        },
        markUnread: function (issue) {
            delete models.unreadList[issue.id];
            util.updateStorage();
        },
        getUnread: function (issue) {
            return !(models.unreadList.hasOwnProperty(issue.id) &&
                models.unreadList[issue.id] === issue.updated_on);
        },
        loadImages: function ($els) {
            $els.each(function () {
                var $this = $(this),
                    xhr = new XMLHttpRequest();

                if (!$this.data('src')) {
                    return;
                }
                xhr.open('get', $(this).data('src'), true);
                xhr.responseType = 'blob';
                xhr.onload = function(e) {
                    $this.attr('src', window.URL.createObjectURL(this.response));
                    $this.removeAttr('data-src');
                };
                xhr.send();
            });
        }
    };

    window.handler = {
        rowStyle: function (row) {
            return row.unread ? {classes: 'unread'} : {};
        },
        query: function (params) {
            params = {
                key: models.key,
                set_filter: 1,
                sort: 'updated_on:desc',
                status_id: $status.val().join('|'),
                limit: params.limit,
                offset: params.offset
            };
            if ($assignedToMe.is(':checked')) {
                params.assigned_to_id = 'me';
            }
            return params;
        },
        response: function (res) {
            $.each(res.issues, function (i, issue) {
                issue.state = $.inArray(issue.id, models.selections) > -1;
                issue.unread = util.getUnread(issue);
            });
            return {
                total: res.total_count,
                rows: res.issues
            }
        }
    };

    window.events = {
        init: function () {
            $('form').submit(function () {
                return false;
            });

            $('#save').click(function () {
                var url = $.trim($url.val());
                if (url.slice(-1) === '/') {
                    url = url.substring(0, url.length - 1);
                }
                models.baseUrl = url;
                models.key = $.trim($key.val());
                util.updateStorage();
                view.users();
            });

            $(window).resize(function () {
                $table.bootstrapTable('resetView', {
                    height: util.getHeight()
                });
            });

            $table.on('post-body.bs.table', function () {
                $('[data-toggle="dropdown"]').dropdown();
                $('[data-toggle="tooltip"]').tooltip();

                $('.columns :checkbox, .table :checkbox').each(function () {
                    if (!$(this).parent().hasClass('checkbox')) {
                        $(this).wrap('<label class="checkbox"></label>').radiocheck();
                    }
                });
                util.loadImages($table.find('img'));
            });

            $table.on('check.bs.table uncheck.bs.table check-all.bs.table uncheck-all.bs.table', function () {
                models.selections = $.map($table.bootstrapTable('getSelections'), function (row) {
                    return row.id;
                });
            });

            $status.on('change', function () {
                $table.bootstrapTable('refresh');
            });

            $assignedToMe.on('switchChange.bootstrapSwitch', function () {
                $table.bootstrapTable('refresh');
            });

            $('#markRead, #markUnread').click(function () {
                var func = $(this).attr('id');

                $.each($table.bootstrapTable('getSelections'), function (i ,issue) {
                    util[func](issue);
                });
                $table.bootstrapTable('refresh', {silent: true});
            });
        },
        subject: {
            'click div': function (e, value, row, index) {
                view.issue(row, index);
            }
        }
    };

    window.view = {
        users: function (limit) {
            $.get(sprintf('%s/users.json', models.baseUrl), {
                limit: limit || 100,
                key: models.key
            }, function (data) {
                if (data.total_count > limit) {
                    view.users(data.total_count);
                    return;
                }
                models.users = data.users;
                view.init();
            }).fail(function () {
                $loading.hide();
                $settings.show();
            });
        },
        init: function () {
            $loading.hide();
            $settings.hide();
            $main.show();
            $table.bootstrapTable({
                url: sprintf('%s/issues.json', models.baseUrl),
                height: util.getHeight()
            });

            setInterval(function () {
                $table.bootstrapTable('refresh', {silent: true});
            }, 2 * 60000);

            $status.select2({dropdownCssClass: 'dropdown-inverse'});
            $assignedToMe.bootstrapSwitch();

            $.fn.modal.defaults.spinner = $.fn.modalmanager.defaults.spinner = $loading.html();
            $.fn.modalmanager.defaults.resize = true;
        },
        issue: function (row, index) {
            $('body').modalmanager('loading');
            $.get(sprintf('%s/issues/%s.json', models.baseUrl, row.id), {
                include: 'attachments,journals',
                key: models.key
            }, function (data) {
                var issue = data.issue,
                    list = [];

                list.push(sprintf(itemTpl, {
                    author: issue.author.name,
                    avatar: formatter.avatar(issue.author),
                    time: formatter.date(issue.created_on),
                    text: textile(issue.description) || '-'
                }));

                $.each(issue.journals, function (i, journal) {
                    if ($.trim(journal.notes)) {
                        list.push(sprintf(itemTpl, {
                            author: journal.user.name,
                            avatar: formatter.avatar(journal.user),
                            time: formatter.date(journal.created_on),
                            text: textile(journal.notes)
                        }));
                    }
                });
                issue.content = list.join('<hr>');

                $.each(issue.attachments, function (i, attachment) {
                    var reg = new RegExp(sprintf('img src="%s"', attachment.filename), 'g');
                    issue.content = issue.content.replace(reg,
                        sprintf('img data-src="%s?key=%s"', attachment.content_url, models.key));
                });

                issue.tracker = formatter.tracker(issue.tracker.name, issue);
                $issue.html(sprintf(issueTpl, issue)).modal();
                util.loadImages($issue.find('img'));
            });

            row.unread = false;
            $table.bootstrapTable('updateRow', {
                index: index,
                row: row
            });
            util.markRead(row);
        }
    };

    events.init();
    models.init(view.users);
});