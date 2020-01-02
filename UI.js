const fs = require('fs');

exports.getUI = (fArrays, workingDir, host = 'http://localhost:3000') => {
    host += workingDir;
    const parentRow = (workingDir == '') ? '' : 
        `<tr>
            <td>
                <a href=${encodeURI(host.substring(0, host.lastIndexOf('/')))}>
                    ...
                </a>
            </td>
        </tr>`;
    host += '/';
    let rows = '';

    Object.entries(fArrays).forEach(([key, value]) => {
        value.forEach(f => {
            const openUrl = (key == 'folder') ? 
                encodeURI(host + f.name)
                : host + 'file-download?file=' + encodeURIComponent(f.name);
            rows += 
                `<tr>
                    <td>
                        <a href=${openUrl}>
                            ${f.name + ((key == 'folder') ? '/' : '')}
                        </a>
                    </td>
                    <td>
                        <form action="${key}-delete" method="post" enctype="multipart/form-data">
                            <input type="hidden" name="${key}" value="${f.name}">
                            <input type="hidden" name="workingDir" value="${workingDir}">
                            <input type="submit" value="Delete">
                        </form>
                    </td>
                    <td>
                        <form action="${key}-rename" method="post" enctype="multipart/form-data">
                            <input type="text" name="newName">
                            <input type="hidden" name="oldName" value="${f.name}">
                            <input type="hidden" name="workingDir" value="${workingDir}">
                            <input type="submit" value="Rename">
                        </form>
                    </td>
                </tr>`;
        });
    });

    return `
        <form action="file-upload" method="post" enctype="multipart/form-data">
            <input type="hidden" name="workingDir" value="${workingDir}">
            <input type="file" name="upload" multiple><br>
            <input type="submit">
        </form>

        <form action="folder-new" method="post" enctype="multipart/form-data">
            <input type="hidden" name="workingDir" value="${workingDir}">
            <input type="text" name="folderName"><br>
            <input type="submit" value="New Folder">
        </form>

        <table>
            <tr>
                <th>Filename</th>
                <th>Delete</th>
                <th>Rename</th>
            </tr>
            ${parentRow}
            ${rows}
        </table>
    `;
}
