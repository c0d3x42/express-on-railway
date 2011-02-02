// Stylize a string
function stylize(str, style) {
    var styles = {
        'bold'      : [1,  22],
        'italic'    : [3,  23],
        'underline' : [4,  24],
        'cyan'      : [96, 39],
        'yellow'    : [33, 39],
        'green'     : [32, 39],
        'red'       : [31, 39],
        'grey'      : [90, 39],
        'green-hi'  : [92, 32],
    };
    return '\033[' + styles[style][0] + 'm' + str +
           '\033[' + styles[style][1] + 'm';
};

var $ = function (str) {
    str = new(String)(str);

    ['bold', 'grey', 'yellow', 'red', 'green', 'white', 'cyan', 'italic', 'underline'].forEach(function (style) {
        Object.defineProperty(str, style, {
            get: function () {
                return $(stylize(this, style));
            }
        });
    });
    return str;
};

function createDir (dir) {
    var root = process.cwd();
    if (path.existsSync(root + '/' + dir)) {
        sys.puts($('exists').bold.grey + '  ' + dir);
    } else {
        fs.mkdirSync(root + '/' + dir, 0755);
        sys.puts($('create').bold.green + '  ' + dir);
    }
}

function createFile (filename, contents) {
    var root = process.cwd();
    if (path.existsSync(root + '/' + filename)) {
        sys.puts($('exists').bold.grey + '  ' + filename);
    } else {
        fs.writeFileSync(root + '/' + filename, contents);
        sys.puts($('create').bold.green + '  ' + filename);
    }
}

<<<<<<< HEAD
function createParents(ns, d) {
=======
function create_file_by_template (filename, template) {
    create_file(filename, fs.readFileSync(__dirname + '/../templates/' + template));
}

function create_parents(ns, d) {
>>>>>>> master
    ns.forEach(function (dir) {
        d += dir + '/';
        createDir(d);
    });
}

function formatType (name) {
    name = (name || 'string').toLowerCase();
    switch (name) {
    case 'string':   return 'String';

    case 'date':     return 'Date';

    case 'bool':
    case 'boolean':  return 'Boolean';

    case 'int':
    case 'real':
    case 'float':
    case 'decimal':
    case 'number':   return 'Number';
    }
    return '"' + name + '"';
}

var fs = require('fs');
var sys = require('sys');
var path = require('path');
var generators = {
    model: function (args) {
        var model = args.shift();
        if (!model) { 
            sys.puts($('Model name required').red.bold);
            return;
        }
        var Model = model[0].toUpperCase() + model.slice(1);
        var attrs = [];
        args.forEach(function (arg) {
            attrs.push('    property("' + arg.split(':')[0] + '", ' + formatType(arg.split(':')[1]) + ');');
        });
        createDir('app/');
        createDir('app/models/');
        createFile('app/models/' + model + '.js', 'var ' + Model + ' = describe("' + Model + '", function () {\n' +
           attrs.join('\n') + '\n});'
        );
    },
    controller: function (args) {
        var controller = args.shift();
        if (!controller) {
            sys.puts($('Controller name required').red.bold);
            return;
        }

        var ns = controller.split('/');
        ns.pop();

        var actions = [];
        args.forEach(function (action) {
            actions.push('    ' + action + ': function (req, next) {\n    }');
        });

        createDir('app/');
        createDir('app/controllers/');
        createParents(ns, 'app/controllers/');

        // controller
        var filename = 'app/controllers/' + controller + '_controller.js';
        createFile(filename, 'module.exports = {\n' + actions.join(',\n') + '\n};');

        createDir('app/helpers/');
        createParents(ns, 'app/helpers/');

        // helper
        filename = 'app/helpers/' + controller + '_helper.js';
        createFile(filename, 'module.exports = {\n};');

        // views
        createDir('app/views/');
        createParents(ns, 'app/views/');
        createDir('app/views/' + controller + '/');
        args.forEach(function (action) {
            createFile('app/views/' + controller + '/' + action + '.ejs', '');
        });
    }
};

var args = process.argv.slice(2);
switch (args.shift()) {
case 'h':
case 'help':
    sys.puts('\nUsage: railway command [argument(s)]\n\n' +
    '  command is:\n' + 
    '    h or help        -- prints this message\n' +
    '    init             -- initialize railway directory structure\n' +
    '    generate [smth]  -- generate smth (model, controller)\n\n');
    process.exit(0);
    break;
case 'init':
    [ 'app/',
      'app/models/',
      'app/controllers/',
      'app/helpers/',
      'app/views/',
      'config/',
      'config/initializers/',
      'public/',
      'public/stylesheets/',
      'public/javascripts/'
    ].forEach(create_dir);
    createFile('config/routes.js', 'exports.routes = function (map) {\n};');
    create_file_by_template('config/requirements.json', 'requirements.json');
    create_file_by_template('Jakefile', 'tasks.js');
    create_file_by_template('app/views/application_layout.ejs', 'layout.ejs');
    create_file_by_template('public/stylesheets/reset.css', 'reset.css');
    create_file_by_template('public/javascripts/rails.js', 'rails.js');

    // patch app.js
    var filename = process.cwd() + '/app.js';
    if (path.existsSync(filename)) {
        var app = fs.readFileSync(filename).toString();
        if (!app.match('express-on-railway')) {
            app = app
                .replace(/(\/\/ Only listen on \$ node app\.js)/, 'require("express-on-railway").init(__dirname, app);\n\n$1')
                .replace("app.set('views', __dirname + '/views');", "app.set('views', __dirname + '/app/views');");
            fs.writeFileSync(filename, app);
            sys.puts($('patch').bold.green + '   app.js');
        } else {
            sys.puts($('patched').bold.grey + ' app.js');
        }
    } else {
        sys.puts($('missing').bold.red + ' app.js');
    }
    break;
case 'generate':
    var what = args.shift();
    if (generators[what]) {
        generators[what](args);
    }
    break;
}

process.exit(0);
