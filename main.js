const { app, BrowserWindow, Notification, Menu, ipcMain } = require("electron");
const PowerShell = require("node-powershell");
const { fork } = require("child_process");
const path = require("path");
const NTSEnvironment = require("./js/sms");

let window;
const ntsEnvironment = new NTSEnvironment();

function createWindow(){
    window = new BrowserWindow({
        fullscreen: true,
        kiosk: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    })
    window.setAlwaysOnTop(true, "screen");
    window.setMenuBarVisibility(false);
    window.loadFile("main.html");
}

var current = "";
var cpuClock = 1000;
async function UpdateProgress(){
    await PowerShell.PowerShell.$`$osenv = New-Object -COMObject Microsoft.SMS.TSEnvironment;$osenv.Value("OSDComputerName");$osenv.Value("_SMSTSCurrentActionName");$osenv.Value("_SMSTSNextInstructionPointer");$osenv.Value("_SMSTSInstructionTableSize");$osenv.Value("MULTICASTPROGRESS");$osenv.Value("DeployRoot")`.then((output) => {
        var terminalOutput = output.raw.trim().split("\n");
        if(terminalOutput[1] == "Install Operating System\r" && terminalOutput.length == 6){
            if(terminalOutput[4].toString() != "99%\r"){
                window.webContents.send("MulticastProgress", terminalOutput[4]);
            } else {
                window.webContents.send("UpdateProgress", terminalOutput);
            }
        }
        if(current != terminalOutput[2]){
            if(terminalOutput[1] == "Install Operating System\r" && terminalOutput.length == 5){
                cpuClock = 200;
            }
            current = terminalOutput[2];
            window.webContents.send("UpdateProgress", terminalOutput);
            if(terminalOutput[2] == terminalOutput[3]){
                app.quit();
            }
        }
    });
    setTimeout(UpdateProgress, cpuClock);
}

UpdateProgress();




app.whenReady().then(() => {
    createWindow();
    

    app.on("activate", () => {
        if(BrowserWindow.getAllWindows().length === 0){
            createWindow();
        }
    })

    ipcMain.on("EnvironmentVariablesValidation", async () => {
        ntsEnvironment.getDeploymentInformation().then(data => {
            window.webContents.send("EnvironmentVariablesValidationSuccess", data);
        }).catch (error => {
            window.webContents.send("EnvironmentVariablesValidationFailed");
        });
    })

    ipcMain.on("RequestSystemInformation", async () => {
        ntsEnvironment.getSystemInformation().then(data => {
            window.webContents.send("SystemInformation", data);
        });
    })
})

app.on("window-all-closed", () => {
    if(process.platform !== "darwin"){
        app.quit();
    }
})