const wait = (delay) => new Promise((resolve) => setTimeout(resolve, delay))
const { ipcRenderer } = require("electron");

var logoElement = document.querySelector(".tsprogressui-logo");
var progressBar = document.querySelector(".progress-bar");
var loadingText = document.querySelector(".loading-text");
var currentStatus = document.querySelector(".current-status");
var progressBarPercentage = document.querySelector(".progress-percentage");
var systemInformation = document.querySelector(".systemInformation");
var taskSequenceName = document.querySelector(".task-sequence-name");

var currentProgress;
var maxProgress;
var currentPercentage;


var previosImagePath = "/images/TSProgressUI_Redefined.png"

const logoClasses = {
   "Default": "TSProgressUI_Redefined.png",
   "Deployment": "",
   "Printer": "Printer_Setup_Logo.png",
   "Drivers": "Downloading_Packages_logo.png",
   "OS_Install": "OS_Download_Logo.png",
   "Imaging_OS": "Applying_OS_Logo.png",
   "BIOS_Update": "BIOS_CPU_LOGO.png",
   "Applications": "Downloading_Packages_Logo.png"
}

function showDeploymentSummary(){
   gsap.to(".deployment-summary", {duration: 2, opacity: 1, stagger: 0.2, ease: "expo.inOut"});
}

function showDeploymentProgress(){
   gsap.to(".deployment-summary", {duration: 2, opacity: 0, stagger: 0.2, ease: "expo.inOut", onComplete: () => {
      gsap.to(".loading-text", {duration: 0.5, opacity: 0, ease: "expo.inOut", onComplete: () => {
         gsap.to(".tsprogressui-logo", {duration: 1, x: "50%", ease: "expo.inOut", onComplete: () => {
            gsap.to(".status-section", {duration: 0.5, opacity: 1, ease: "expo.inOut"});
         }})
      }})
   }});
}

function showFailedDeployment(){
   gsap.to(logoElement, {duration: 1, opacity: 0, ease: "expo.inOut", onComplete: () => {
      logoElement.src = `./images/Unsuccesful_Deployment_Logo.png`;
      gsap.to(logoElement, {duration: 1, opacity: 1, ease: "expo.inOut"});
   }})
}

function changeLoadingText(status){
   gsap.to(".loading-text", {duration: 1, opacity: 0, ease: "expo.inOut", onComplete: () => {
      loadingText.innerHTML = status;
      gsap.to(".loading-text", {duration: 1, opacity: 1, ease: "expo.inOut"});
   }})
}

function changeDeploymentLogo(logo){
   if (logo != previosImagePath){
      gsap.to(logoElement, {duration: 1, opacity: 0, ease: "expo.inOut", onComplete: () => {
         console.log(`Change Path To => /images/${logo}`);
         logoElement.src = `./images/${logo}`;
         previosImagePath = logo;
         gsap.to(logoElement, {duration: 1, opacity: 1, ease: "expo.inOut"});
      }})
   }
}

window.onload = async () => {
   await wait(2000);
   changeLoadingText("Validating Task Sequence");
   ipcRenderer.send("EnvironmentVariablesValidation");
   console.log("Validation Request Sent");
   ipcRenderer.on("EnvironmentVariablesValidationSuccess", async (event, data) => {
      console.log(data);
      systemInformation.firstChild.textContent = data.systemInformation;
      taskSequenceName.firstChild.textContent = data.taskSequenceName;
      await wait(2000);
      showDeploymentSummary();
      await wait(4000);
      console.log("Validation Passed");
      changeLoadingText("Starting Deployment");
      await wait(2000);
      showDeploymentProgress();
      await wait(2000);
   });

   ipcRenderer.on("EnvironmentVariablesValidationFailed", async (event, data) => {
      showFailedDeployment();
   })
}


ipcRenderer.on("UpdateProgress", (event, data) => {
   currentProgress = parseInt(data[2], 10);
   maxProgress = parseInt(data[3], 10)
   currentPercentage = Math.floor((currentProgress/maxProgress) * 100);
   progressBar.style.width = `${currentPercentage}%`;
   progressBarPercentage.innerHTML = `${currentPercentage}%`;
   progressBarPercentage.style.width = `${currentPercentage}%`;
   
   currentStatus.innerHTML = `${data[1]}`

   var currentActionName = data[1];

   if(currentActionName.toLowerCase() == "WINPEPrinterUI Utility Tool\n".toLowerCase()){
      changeDeploymentLogo(logoClasses["Printer"]);
   } else if(currentActionName.toLowerCase().includes("drivers")){
      changeDeploymentLogo(logoClasses["Drivers"]);
   } else if(currentActionName.toLowerCase() == "Lenovo Boot Utility\n".toLowerCase()){
      changeDeploymentLogo(logoClasses["BIOS_Update"]);
   } else if(currentActionName.toLowerCase() == "Install Operating System\r".toLowerCase()){
      changeDeploymentLogo(logoClasses["OS_Install"]);
   } else if(currentActionName.toLowerCase().includes("multicast")){
      changeDeploymentLogo(logoClasses["Imaging_OS"]);
   } else {
      changeDeploymentLogo(logoClasses["Default"]);
   }
})

ipcRenderer.on("MulticastProgress", (event, data) => {
   if(data == "\r"){
      currentStatus.innerHTML = `Multicast (Waiting for connection.......)`;
   } else {
      currentStatus.innerHTML = `Multicast ${data}`;
   }
  
})

ipcRenderer.on("DeploymentFailed", (event, data) => {
   showFailedDeployment();
})