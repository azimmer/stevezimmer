stevezimmer is the codebase for steve-zimmer.com
Which is a small single page application site for Steve Zimmer, math & science tutor.
====================================================================================

Install nvm
-----------

You'll need to install and activate nvm to follow the rest of the instructions.
You can see if you have it installed by running (CLI):

    > nvm --version

If you don't have it, install nvm via (https://github.com/creationix/nvm#install-script)
before proceeding further.


Get the code
------------

If you haven't already, you can clone the git repository containing this repo to get the
source code.
The rest of these instructions assume that the root of the repository is your current working
directory in your shell.


Switch to (and possibly install) the correct Node version
---------------------------------------------------------

Activate the appropriate node version:

    > nvm use

If nvm tells you that the required version is not yet installed, you can install it:

    > nvm install

After running this command, you should be able to re-run the previous command successfully.
You won't have to install node again, unless the target node version changes.


Installing/Updating Dependencies
--------------------------------

This codebase uses npm for server-side and dev environment dependencies.
The following commands should get you everything you need once the correct version of node
is installed.

    > npm install
    > npm prune


Start a Development Environment
-------------------------------

This codebase uses Grunt as a taskmanager for a number of tasks, including firing up a localhost
node server. The following command should fire up a localhost of the index.html page:

    > npm start


Tests
-----

This codebase has no unit or validation tests yet. It does have a linting task,
whose rules are defined within the .jshintrc and .jscsrc files. You can run this task by:

    > npm run lint

Since there are no tests, manual QA is required on a subset of OSes/browsers/devices.
The recommended list includes:
Desktop:
OSX (a recent version)
    Safari
    *Chrome
    *Firefox
Windows (7 or a more recent version)
    IE11 or Edge
    *Chrome
    *Firefox
Devices: [definitely an iphone, preferably also an ipad, as well as an android phone]
iOS (a recent version)
    Safari
Android (a recent version)
    Chrome

*if you test Chrome and Firefox on a Mac, you should not have to repeat on a PC; and vice versa

Creating the Deployable Files
-----------------------------

This codebase uses grunt to minify both javascript and css, and to copy all of the other
relevant files from the dev directory to a build directory. Run this via:

    > npm run make


You can then ftp up the changed files as needed.



