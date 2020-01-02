const http = require('http');
const fs = require('fs');
const formidable = require('formidable');
const url = require('url');
const UI = require('./UI');

const hostname = 'localhost';
const port = 3000;

const server = http.createServer((req, res) => {
    const q = url.parse(req.url, true);
    const path = decodeURIComponent(q.pathname);
    // console.log(path);
    
    if (path.endsWith('/file-upload')) {
        uploadFiles(req, res);
    } else if (path.endsWith('/file-download')) {
        const file = q.query.file;
        const workingDir = path.substr(0, path.indexOf('/file-download'));f

        downloadFile(res, workingDir, file);
    } else if (path.endsWith('/file-delete')) {
        deleteFile(req, res);
    } else if (path.endsWith('/file-rename')) {
        renameFile(req, res);
    } else if (path.endsWith('/folder-new')) {
        newFolder(req, res);
    } else if (path.endsWith('/folder-delete')) {
        deleteFolder(req, res);
    } else if (path.endsWith('/folder-rename')) {
        renameFolder(req, res);
    } else if (path.endsWith('/folder-open')) {
        openFolder(req, res);
    // } else if (path == '/folder-download') {
    //     downloadFolder(req, res);
    } else {
        const workingDir = path == '/' ? '' : path;
        fs.exists('./uploads' + path, (exists) => {
            if (exists) {
                displayUI(req, res, workingDir);
            } else {
                res.status = 404;
                res.setHeader('Content-Type', 'text/html');
                res.write('404 ERROR: Folder not found: ' + path);
                res.end();        
            }
        });
    }
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});

function displayUI(req, res, workingDir = '') {
    fs.readdir('./uploads' + workingDir, {withFileTypes: true}, (err, files) => {
        if (err) throw err;
        const fArrays = {
            folder: files.filter(f => f.isDirectory()),
            file: files.filter(f => f.isFile())
        }
        
        res.status = 200;
        res.setHeader('Content-Type', 'text/html');
        res.write(UI.getUI(fArrays, workingDir));
        res.end();
    });
}

function uploadFiles(req, res) {
    const form = new formidable.IncomingForm();
    let files = [];
    let workingDir = '';

    form.on('file', (field, file) => {
        files.push(file);
    });

    form.on('field', function(name, value) {
        if (name == 'workingDir')
            workingDir = value;
    });

    form.on('end', () => {
        files.forEach(file => {
            const oldpath = file.path;
            const newpath = './uploads' + workingDir + '/' + file.name;
            fs.renameSync(oldpath, newpath);
        });
    });
    
    form.parse(req, (err, fields, files) => {
        if (err) throw err;
        res.writeHead(301, {'Location': `http://${hostname}:${port}${workingDir}`});
        res.end();
    });
}

function deleteFile(req, res) {
    const form = new formidable.IncomingForm();

    form.parse(req, (err, fields, files) => {
        if (err) throw err;

        const workingDir = fields.workingDir;
        const file = fields.file;
        
        fs.unlink('./uploads' + workingDir + '/' + decodeURIComponent(file), (err) => {
            if (err) throw err;
            res.writeHead(301, {'Location': `http://${hostname}:${port}${workingDir}`});
            res.end();
        });
    });
}

function renameFile(req, res) {
    const form = new formidable.IncomingForm();

    form.parse(req, (err, fields, files) => {
        if (err) throw err;

        const oldName = fields.oldName;
        const newName = fields.newName;
        const workingDir = fields.workingDir;
        
        const oldpath = './uploads' + workingDir + '/' + oldName;
        const newpath = './uploads' + workingDir + '/' + newName;
        fs.rename(oldpath, newpath, (err) => {
            if (err) throw err;
            res.writeHead(301, {'Location': `http://${hostname}:${port}${workingDir}`});
            res.end();
        });
    });
}

function downloadFile(res, workingDir, file) {
    if (workingDir != '/')
        workingDir += '/';

    fs.readFile('./uploads' + workingDir + decodeURIComponent(file), (err, content) => {
        if (err) throw err;
        res.setHeader('Content-disposition', 'attachment; filename='+file);
        res.end(content);
    });
}

function newFolder(req, res) {
    const form = new formidable.IncomingForm();

    form.parse(req, (err, fields, files) => {
        if (err) throw err;
        
        const workingDir = fields.workingDir;
        const originalFolderName = './uploads' + workingDir + '/' + (fields.folderName || 'new folder');
        let i = 0;
        let folderName = originalFolderName;

        do {
            i++;
            var errCode = null;
            try {
                fs.mkdirSync(folderName);
            } catch(e) {
                errCode = e.code;
                folderName = originalFolderName + `(${i})`;
            }
        } while (errCode == 'EEXIST');
        res.writeHead(301, {'Location': `http://${hostname}:${port}${workingDir}`});
        res.end();
    });
}

function deleteFolder(req, res) {
    const form = new formidable.IncomingForm();

    form.parse(req, (err, fields, files) => {
        if (err) throw err;

        const workingDir = fields.workingDir;
        const folder = fields.folder;
        
        fs.rmdir('./uploads' + workingDir + '/' + decodeURIComponent(folder), (err) => {
            if (err) throw err;
            res.writeHead(301, {'Location': `http://${hostname}:${port}${workingDir}`});
            res.end();
        });
    });

}

function renameFolder(req, res) {
    const form = new formidable.IncomingForm();

    form.parse(req, (err, fields, files) => {
        if (err) throw err;
        
        let oldpath = './uploads/' + fields.oldName;
        let newpath = './uploads/' + fields.newName;
        fs.rename(oldpath, newpath, (err) => {
            if (err) throw err;
            res.writeHead(301, {'Location': `http://${hostname}:${port}/`});
            res.end();
        });
    });
}
