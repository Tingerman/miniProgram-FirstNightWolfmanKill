// app.js

// import { promisifyAll } from 'miniprogram-api-promise'

// // 声明一个常量，为一个空对象，
// // 并在wx顶级对象下添加一个属性p也指向该空对象，使所有成员都可以使用该对象
// const wxp = wx.p = {}
// // promisify all wx's api
// // 参数1： wx顶级对象
// // 参数2： wxp指向一个空对象
// promisifyAll(wx, wxp)

App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
  },
  globalData: {
    userInfo: null,
    // url_1:"",
    // url_2:""
  }
  
})

// wx.cloud.init();
// let url_1="";
// wx.cloud.getTempFileURL({
//   fileList: [{
//     fileID: 'cloud://env-4g6l45oe9fc17cd1.656e-env-4g6l45oe9fc17cd1-1312297212/AaLanSong-2.ttf',
//     maxAge: 600 * 600, // one hour
//   }]
// }).then(res => {
//   // get temp file URL
//   console.log(res.fileList[0].tempFileURL);
//   url_1=res.fileList[0].tempFileURL;
// }).catch(error => {
//   // handle error
// });

// let url_2="";
// wx.cloud.getTempFileURL({
//   fileList: [{
//     fileID: 'cloud://env-4g6l45oe9fc17cd1.656e-env-4g6l45oe9fc17cd1-1312297212/H-SiuNiu-Bold-2.ttf',
//     maxAge: 600 * 600, // one hour
//   }]
// }).then(res => {
//   // get temp file URL
//   console.log(res.fileList[0].tempFileURL);
//   url_2=res.fileList[0].tempFileURL;
// }).catch(error => {
//   // handle error
// });

// wx.loadFontFace({
//   // family: 'webfont',
//   // source: 'url("//at.alicdn.com/t/webfont_1f7b3qbimiv.eot")',


//   // family:"songti",
//   // source:url_1,

//   // family:"songti_title",
//   // source:url_2,

//   family: "songti",
//   source: 'url("https://656e-env-4g6l45oe9fc17cd1-1312297212.tcb.qcloud.la/AaLanSong-2.ttf?sign=2508dc5c2dae26a29eeada6d287444a3&t=1656574542")',

//   family:"songti_title",
//   source:'url("https://656e-env-4g6l45oe9fc17cd1-1312297212.tcb.qcloud.la/H-SiuNiu-Bold-2.ttf?sign=6770048af847da865f0a754253c3bc85&t=1656574571")',


//   success: function (res) {
//       console.log(res.status) //  loaded
//   },
//   fail: function (res) {
//       console.log(res.status) //  error
//   },
//   complete: function (res) {
//       console.log(res.status);
//   }
// });


