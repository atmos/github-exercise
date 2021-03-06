/* global requirejs */

require.config({
  baseUrl: './',
  paths: {
    "t": "templates",
    "underscore": "_vendor/bower_components/lodash/dist/lodash",
    "backbone": "_vendor/bower_components/backbone/backbone",
    "backbone-all": "lib/backbone-all",
    "backbone.noConflict": "lib/backbone.noConflict",
    "backbone.marionette": "_vendor/bower_components/backbone.marionette/lib/core/amd/backbone.marionette",
    "backbone.wreqr": "_vendor/bower_components/backbone.wreqr/lib/amd/backbone.wreqr",
    "backbone.babysitter": "_vendor/bower_components/backbone.babysitter/lib/amd/backbone.babysitter",
    "mustache": "_vendor/bower_components/mustache/mustache",
    "jquery": "_vendor/bower_components/jquery/dist/jquery",
    "bootstrap": "_vendor/bootstrap/dist/js/bootstrap.min",
    "text": "_vendor/bower_components/text/text",
    "EventEmitter": "util/emitter",
    //"Github": "_vendor/bower_components/github/github",
    "Github": "_vendor/github",
    "Base64": "_vendor/base64",
    "moment": "_vendor/bower_components/moment/moment"
  },
  map: {
    '*': {
      'backbone': 'backbone-all'
    },
    'backbone-all': {
      'backbone': 'backbone.noConflict'
    },
    'backbone.marionette': {
      'backbone': 'backbone.noConflict'
    },
    'backbone.wreqr': {
      'backbone': 'backbone.noConflict'
    },
    'backbone.babysitter': {
      'backbone': 'backbone.noConflict'
    },
    'backbone.noConflict': {
      'backbone': 'backbone'
    }
  },
  shim: {
    'bootstrap': ['jquery']
  }
});

define([
  'underscore', 'jquery', 'backbone', 'mustache',
  'EventEmitter', 'Github', 'moment',
  'text!t/profile-input.mustache',
  'text!t/repo-table.mustache', 'text!t/repo-table-row.mustache',
  'text!t/repo-table-row-empty.mustache',
  'util/window_log',
  'bootstrap', 'text',
], function (
  _, $, Backbone, Mustache,
  EventEmitter, Github, moment,
  ProfileInputTpl,
  RepoTableTpl, RepoTableRowTpl,
  RepoTableRowEmptyTpl) {

  Backbone.Marionette.Renderer.render = function(template, data) {
    return Mustache.render(template, data);
  };

  var app = new Backbone.Marionette.Application();

  var github = new Github({
    token: "461b5636e8d8e58f6fccf71d65cd008571dda11b",
    auth: "oauth"
  });
  window.gh = github;

  var RepoBranch = Backbone.Model.extend({
    initialize: function(models, options) {
      this.user = this.collection.user || options.user || null; // backref to the user model.
      this.repo = this.collection.repo || options.repo || null; // backref to repo model

      // Include Github.User instance with Oauth token in context.
      this.gh = gh.getRepo(this.user.get('login'), this.repo.get('name'));
    },

  });

  var RepoBranches = Backbone.Collection.extend({
    model: RepoBranch,
    initialize: function(models, options) {
      this.user = options.user || null; // backref to the user model.
      this.repo = options.repo || null; // backref to repo model

      // Include Github.User instance with Oauth token in context.
      this.gh = gh.getRepo(this.user.get('login'), this.repo.get('name'));
    },
    sync: function(method, collection, options) {
      // Override sync for read/GET to use Github.js.
      //var login = collection.user.get('login');
      var login = this.user.get('login');

      if (method !== 'read') {
        return Backbone.sync.apply(this, arguments);
      }

      this.gh.getBranches({}, function(err, resp) {
        if (resp) {
          options.success(resp);
        } else {
          options.error(err);
        }
      });

    }

  });

  var RepoCollaborator = Backbone.Model.extend({
    initialize: function(models, options) {
      this.user = this.collection.user || options.user || null; // backref to the user model.
      this.repo = this.collection.repo || options.repo || null; // backref to repo model

      // Include Github.User instance with Oauth token in context.
      this.gh = gh.getRepo(this.user.get('login'), this.repo.get('name'));
    },

  });


  var RepoCollaborators = Backbone.Collection.extend({
    model: RepoCollaborator,
    initialize: function(models, options) {
      this.user = options.user || null; // backref to the user model.
      this.repo = options.repo || null; // backref to repo model

      // Include Github.User instance with Oauth token in context.
      this.gh = gh.getRepo(this.user.get('login'), this.repo.get('name'));
    },
    sync: function(method, collection, options) {
      // Override sync for read/GET to use Github.js.
      //var login = collection.user.get('login');
      var login = this.user.get('login');

      if (method !== 'read') {
        return Backbone.sync.apply(this, arguments);
      }

      this.gh.getCollaborators({}, function(err, resp) {
        if (resp) {
          options.success(resp);
        } else {
          options.error(err);
        }
      });

    }
  });

  var Repo = Backbone.Model.extend({
    initialize: function(models, options) {
      // Include Github.User instance with Oauth token in context.
      this.gh = gh.getUser();

      this.user = this.collection.user || options.user || null; // backref to the user model.

      this.collaborators = new RepoCollaborators([], {
        user: this.user,
        repo: this
      });
      this.branches = new RepoBranches([], {
        user: this.user,
        repo: this
      });
    },
    parse: function(resp) {
      // format with updated_at from gh with moment.js.
      resp['updated_at'] = moment(resp['updated_at']).format('YYYY-MM-DD hh:mm A')
      return resp;
    },
    sync: function(method, collection, options) {
      // Override sync for read/GET to use Github.js.
      //var login = collection.user.get('login');
      var login = this.user.get('login');

      if (method !== 'read') {
        return Backbone.sync.apply(this, arguments);
      }

      this.gh.userRepos(login, function(err, resp) {
        if (resp) {
          options.success(resp);
        } else {
          options.error(err);
        }
      });

    }

  });


  var Repos = Backbone.Collection.extend({
    initialize: function(models, options) {
      // Include Github.User instance with Oauth token in context.
      this.gh = gh.getUser();

      this.user = options.user || null; // backref to the user model.
    },
    sync: function(method, collection, options) {
      // Override sync for read/GET to use Github.js.
      //var login = collection.user.get('login');
      var login = this.user.get('login');

      if (method !== 'read') {
        return Backbone.sync.apply(this, arguments);
      }

      this.gh.userRepos(login, function(err, resp) {
        if (resp) {
          options.success(resp);
        } else {
          options.error(err);
        }
      });

    },
    model: Repo
  });


  var User = Backbone.Model.extend({
    initialize: function() {
      // Include Github.User instance with Oauth token in context.
      this.gh = gh.getUser();
      this.repos = new Repos([], { user: this });
    },
    sync: function(method, model, options) {
      // Override sync for read/GET to use Github.js.
      var login = model.get('login');

      if (method !== 'read') {
        return Backbone.sync.apply(this, arguments);
      }

      this.gh.show(login, function(err, resp) {
        
        if (resp) {
          options.success(resp);
        } else {
          options.error(err);
        }
      });

    }
  });


  var RepoLayout = Backbone.Marionette.Layout.extend({
    template: '<div id="repo-table"></div>',
    regions: {
      table: '#repo-table'
    }
  });

  var LoadingView = Backbone.Marionette.ItemView.extend({
    template: 'Loading...'
  });

  var RepoBranchesItem = Backbone.Marionette.ItemView.extend({
    tagName: 'a',
    attributes: function() {
      return {
        href: Mustache.render('{{{ html_url }}}/tree/{{ name }}', {
            html_url: this.model.repo.get('html_url'),
            name: this.model.get('name')
        })
      }
    },
    className: 'btn btn-xs btn-primary',
    template: '{{ name }}'
  });

  var RepoBranchesItems = Backbone.Marionette.CompositeView.extend({
    emptyView: LoadingView,
    itemView: RepoBranchesItem,
    template: 'Branches: <span class="branch-list"></span>',
    itemViewContainer: "span.branch-list",

  });

  var RepoCollaboratorsItem = Backbone.Marionette.ItemView.extend({
    tagName: 'a',
    attributes: function() {
      return {
        href:  this.model.get('html_url')
      }
    },
    className: 'btn btn-xs btn-success',
    template: '{{ login }}'
  });

  var RepoCollaboratorsItems = Backbone.Marionette.CompositeView.extend({
    tagName: 'span',
    emptyView: LoadingView,
    itemView: RepoCollaboratorsItem,
    template: '<span class="collaborator-list"></span>',
    itemViewContainer: "span.collaborator-list",
  });

  var RepoTableRow = Backbone.Marionette.Layout.extend({
    template: RepoTableRowTpl,
    tagName: "tr",
    regions: {
      'branches': '.branches',
      'collaborators': '.collaborators'
    },
    onShow: function() {
      var branches = new RepoBranchesItems({
        collection: this.model.branches,
        model: this.model
      });
      this.branches.show(branches);
      this.model.branches.fetch();
      var collaborators = new RepoCollaboratorsItems({
        collection: this.model.collaborators,
        model: this.model
      });
      this.collaborators.show(collaborators);
      this.model.collaborators.fetch();
    }
  });

  var RepoTableRowEmpty = Backbone.Marionette.ItemView.extend({
    template: RepoTableRowEmptyTpl,
    tagName: "tr",
  });


  var RepoTable = Backbone.Marionette.CompositeView.extend({
    template: RepoTableTpl,
    emptyView: RepoTableRowEmpty,
    itemView: RepoTableRow,
    itemViewContainer: "tbody",
  });

  var emitter = new EventEmitter(); // just for fun. From step 1 of directions.

  function loadRepos(login){
    // Prepare Views as object in advance for data propagation.

    // Instantiation User module.
    var user = new User({
      "login": login
    });

    // Fetch initial user data
    user.fetch();

    var repos = user.repos;

    // Fetch repos for user.
    repos.fetch()

    var repoTable = new RepoTable({
      collection: repos,
      model: user
    });

    repoLayout = new RepoLayout();

    app.repos.show(repoLayout);
    repoLayout.table.show(repoTable);
  }


  var ProfileLayout = Backbone.Marionette.Layout.extend({
    template: '<form id="profile-input"></form>',
    regions: {
      input: '#profile-input'
    }
  });


  var ProfileInput = Backbone.Marionette.ItemView.extend({
    template: ProfileInputTpl,
    className: 'input-group',
    events: {
      'keydown': 'keyPress',
      'click button': 'submitForm',
      'submit': 'submitForm'
    },
    keyPress: function(e) {
      if (e.which === 13) {
        e.preventDefault();
        e.stopPropagation();
        this.$('button').click();
      }
    },
    submitForm: function(e) {
      e.preventDefault();
      e.stopPropagation();
      var login = this.$('input[type=text]').val();
      loadRepos(login);
      return false;
    },
    modelEvents: {
      'change': 'render'
    },
    model: new Backbone.Model,
    onShow: function() {
      var login = this.$('input[type=text]').focus();
    }
  });  // similar to Backbone.View


  app.addRegions({
    repos: "#repos",
    profile: "#profile"
  });

  var profile = new ProfileLayout()
  app.profile.show(profile);

  var profileInput = new ProfileInput();
  profile.input.show(profileInput);

  app.addInitializer(function (options) {
    console.log('App started. ' + Date());
  });

  app.start();

  return app;
});
