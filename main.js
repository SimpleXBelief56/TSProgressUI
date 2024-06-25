const { app, BrowserWindow, Notification, Menu, ipcMain } = require("electron");
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
    ntsEnvironment.getDeploymentStatus().then(deploymentStatus => {

        // Check if Multicast is in progress        
        if(deploymentStatus.isMulticast && deploymentStatus.multicastProgress != "95%"){
            window.webContents.send("MulticastProgress", deploymentStatus.multicastProgress);
        } else {
            window.webContents.send("UpdateProgress",  [deploymentStatus.OSDComputerName, deploymentStatus.currentAction, deploymentStatus.currentIndex, deploymentStatus.maxIndex])
        }

        // Check if the current action has switched and the deployment is done
        if(current != deploymentStatus.currentAction){
            current = deploymentStatus.currentAction;
            if(deploymentStatus.currentIndex == deploymentStatus.maxIndex){
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