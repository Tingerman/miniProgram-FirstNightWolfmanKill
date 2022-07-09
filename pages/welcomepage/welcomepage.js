// pages/welcomepage/welcomepage.js


Page({

    /**
     * 页面的初始数据
     */
    data: {

        userInfo: {},
        hasUserInfo: false,
        canIUse: wx.canIUse('button.open-type.getUserInfo'),
        canIUseGetUserProfile: false,
        canIUseOpenData: wx.canIUse('open-data.type.userAvatarUrl') && wx.canIUse('open-data.type.userNickName') ,// 如需尝试获取用户信息可改为false
        openid:"",

        list:[],//数据库取数测试变量

        //加入对局的数据库查询结果，0为初始值，1为加入成功，2为房间号不存在，3为请求失败  目前还没有做：4为房间已满员 5为游戏已结束 6为已经在游戏中啦，回到游戏
        jr_status:0,

        //当前输入的房间号
        cur_input_rn:0,

        //当前加入的房间号
        cur_jr_rn:0,

        //三个按钮的开启状态
        cj:false,
        jr:false,
        ls:false,

        //选择进度
        cj_step:1,
        jr_step:1,
        ls_step:1,

        //选择角色
        roles:[
            {"role":"狼王","img":"./images/langwang.svg","selected":false,"num":0,"type":"lang"},
            {"role":"白狼王","img":"./images/bailangwang.svg","selected":false,"num":0,"type":"lang"},
            {"role":"预言家","img":"./images/yuyanjia.svg","selected":false,"num":0,"type":"shen"},
            {"role":"女巫","img":"./images/nvwu.svg","selected":false,"num":0,"type":"shen"},
            {"role":"猎人","img":"./images/lieren.svg","selected":false,"num":0,"type":"shen"},
            {"role":"守卫","img":"./images/shouwei.svg","selected":false,"num":0,"type":"shen"},
            {"role":"骑士","img":"./images/qishi.svg","selected":false,"num":0,"type":"shen"},
            {"role":"白痴","img":"./images/baichi.svg","selected":false,"num":0,"type":"shen"},

            {"role":"狼人","img":"./images/langrensha.svg","selected":false,"num":0,"type":"lang"},
            {"role":"村民","img":"./images/cunmin.svg","selected":false,"num":0,"type":"min"}
            // {"role":"奇迹商人","img":"./images/qijishangren.svg"},
        ],

       //房间号
        room_num:0,

        //玩家人数
        player_num:9,

        //上帝模式 0为首夜，1为全程
        god_mode:0,

        //狼人团队总人数
        wolves:3,

    },

    getUserProfile() {
        // 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认，开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
        wx.getUserProfile({
          desc: '展示用户信息', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
          success: (res) => {
            console.log(res)
            this.setData({
              userInfo: res.userInfo,
              hasUserInfo: true
            })
          }
        })
      },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        wx.cloud.init();
        if (wx.getUserProfile) {
            this.setData({
              canIUseGetUserProfile: true
            })
          }

    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {
        
    },
    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        this.GetID();

    },

    GetID(){
         // 云开发初始化
        if (!wx.cloud) {
            console.error('不支持云开发，请使用 2.2.3 或以上的基础库');
        } else {
            wx.cloud.init({
            env: "env-4g6l45oe9fc17cd1",//这里是你云环境的id,打开云开发面板可以看到
            traceUser: true
            });
    
            wx.cloud.callFunction({
            name: 'GetID', //云函数名称 
            complete: res => { 
                console.log(res.result.openid);//返回值
                this.setData({openid:res.result.openid});
            }
            })
        }
  
    },


    // GetID(){
    //     wx.getUserInfo({
    //       //成功后会返回
    //       success:(res)=>{
    //         console.log(res);
    //         // 把你的用户信息存到一个变量中方便下面使用
    //         let userInfo= res.userInfo
    //         //获取openId（需要code来换取）这是用户的唯一标识符
    //         // 获取code值
    //         wx.login({
    //           //成功放回
    //           success:(res)=>{
    //             console.log(res);
    //             let code=res.code
    //             // 通过code换取openId
    //             wx.request({
    //               url: ``, //这里写入敏感信息
    //               success:(res)=>{
    //                 console.log(res);
    //                 userInfo.openid=res.data.openid
    //                 // console.log(userInfo.openid);
    //                 this.setData({oppenid:userInfo.openid});
    //                 console.log("oppenid:"+this.data.oppenid);
    //               }
    //             })
    //             // this.setData({oppenid:userInfo.openid});
    //             // console.log("oppenid:"+this.data.oppenid);
    //           }
    //         })
     
    //       }
    //     })
    //   },

    GetPlayerInfo(e){
        console.log("GetPlayerInfo这个方法，写players数据库的，被调用了");
        this.GetID();
        if(this.data.userInfo.nickName){
        // this.getUserProfile();
        //写进数据库
        const db = wx.cloud.database();
        db.collection('players').where({
            //where中填寻找的条件，搜索的结果为并集 ，即满足所有条件，条件数量没有限制，不加会遍历该集合
            _id: this.data.openid,//寻找集合中_id值为 data中id的项        
            })  .get().then((res)=>{
                if(!res.data.length){
                    console.log(typeof this.data.userInfo.nickName);
                    console.log(typeof this.data.userInfo.avatarUrl);
                    db.collection('players').add({
                        // data 字段表示需新增的 JSON 数据
                        data: {
                            // _id: 'todo-identifiant-aleatoire', // 可选自定义 _id
                            _id: this.data.openid,   //games表的id就是房间号
                            plr_nickname:this.data.userInfo.nickName,
                            plr_avatarurl:this.data.userInfo.avatarUrl,
                            update_time: new Date(),
                        }
                    });
                }
            });
        }
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    },

    chuangjian(e){
        // console.log("tobedone:创建对局");
        if(!this.data.hasUserInfo)(
            this.getUserProfile(e)
        )
        this.setData({cj:true});
        // console.log(e)
    },

    jiaru(e){
        // console.log("tobedone:加入对局")
        //用户信息权限
        if(!this.data.hasUserInfo)(
            this.getUserProfile(e)
        )
        //显示popup
        this.setData({jr:true});

    },

    lishi(e){
        // console.log("tobedone:历史对局")
        if(!this.data.hasUserInfo)(
            this.getUserProfile(e)
        )
        this.setData({ls:true});
    },

    recover(e){
        this.setData({cj:false});
        this.setData({cj_step:1});
        this.setData({jr:false});
        this.setData({jr_step:1});
        this.setData({ls:false});
        this.setData({ls_step:1});
        console.log("recovering");
        console.log(e);
    },

    next_step(e){
        this.setData({cj_step:this.data.cj_step+1});
        console.log("next_step"); 
        console.log(this.data);   
    },

    previous_step(e){
        this.setData({cj_step:this.data.cj_step-1});
        console.log("previous_step"); 
        console.log(this.data);   
    },

    next_step_jr(e){
        this.setData({jr_step:this.data.jr_step+1});
        console.log("next_step_jr"); 
        console.log(this.data);
        if(this.data.cur_input_rn){this.SearchRoomID(this.data.cur_input_rn);}
    },


    SelectRole(e){
        console.log(e.currentTarget.id);
        let role_id= parseInt(e.currentTarget.id);
        console.log(this.data.roles[role_id].role);
        console.log(typeof role_id);
        // this.setData({['roles[${role_id}].selected']:true}); //不知道为什么不行，`和'有什么区别
        if (this.data.roles[role_id].selected){
            this.setData({[`roles[${role_id}].selected`]:false});
            this.setData({[`roles[${role_id}].num`]:0});
        }
        else{
            this.setData({[`roles[${role_id}].selected`]:true});
            this.setData({[`roles[${role_id}].num`]:1});
        }

    },

    RandRoomNum() {
        //加入数据库检查重复
        let pre_room=Math.floor(Math.random()*(9999-1000))+1000;
        const db = wx.cloud.database();
        let alreadyhas=0;
        db.collection('games').where({_id:pre_room}).get().then(res =>{
            if(res.data&&res.data.length!=0){alreadyhas=1;}
        });
        while(alreadyhas==1){
            pre_room=Math.floor(Math.random()*(9999-1000))+1000;
            db.collection('games').doc({pre_room}).get().then(res =>{
                if(!res.data){alreadyhas=0;}
            });
        }
        let room=pre_room;
        this.setData({room_num:room});
       //  this.setData({game_amt:this.data.game_amt+1});
        console.log(this.data.room_num);
   },
   
    CreateRole(e){
        this.setData({cj_step:this.data.cj_step+1});
        console.log("next_step"); 
        console.log(this.data);   
        console.log("游戏创建中..."); 
        this.RandRoomNum();
        //处理余下角色数量
        //普通狼人
        let normal_wolf_num=this.data.wolves-this.data.roles[0].num-this.data.roles[1].num;
        console.log("普通狼人人数：",normal_wolf_num);
        this.setData({'roles[8].num':normal_wolf_num});
        //村民
        let villager_num=this.data.player_num-this.data.wolves;
        for(var i=2;i<8;i++){
            villager_num-=this.data.roles[i].num;
        }
        console.log("普通村民人数：",villager_num);
        this.setData({'roles[9].num':villager_num});

        //写进数据库
        const db = wx.cloud.database();
        let founder_id=this.data.openid;
        let ids=[];
        ids[0]=founder_id;
        db.collection('games').add({
            // data 字段表示需新增的 JSON 数据
            data: {
                // _id: 'todo-identifiant-aleatoire', // 可选自定义 _id
                _id: this.data.room_num,   //games表的id就是房间号
                create_time: new Date(),
                god_mode:this.data.god_mode,
                player_num:this.data.player_num,
                roles_arr:this.data.roles,
                players_ids:ids,
                wolves_num:this.data.wolves,
                step2_ready_num:0, //确认身份环节点击了“就绪”的人数
                step3_ready_num:0 //首夜狼预守环节点击了“就绪”的人数

            },
            success: function(res) {
                // res 是一个对象，其中有 _id 字段标记刚创建的记录的 id
                console.log(res)
            }
            })
    },

    CreateGame(e){
        this.GetPlayerInfo(e);

        // //保留房间号数据，带到下一个page
        let latest_room_num=this.data.room_num;

        wx.navigateTo({
          url: '../game_started/game_started?room_num='+latest_room_num,
        });


    },

      ChoosePlayerNum(e){
        // console.log(e);
        console.log(e.detail.count);
        this.setData({player_num:e.detail.count});
        console.log(this.data.player_num);
      },

      ChooseMode(e){
        console.log(e.detail.currentKey);
        console.log("mode test");
        let key=parseInt(e.detail.currentKey);
        this.setData({god_mode:key});
        console.log(this.data.god_mode);

      },

      ChooseWolfNum(e){
        // console.log(e);
        console.log(e.detail.count);
        this.setData({wolves:e.detail.count});
        console.log(this.data.wolves);

      },

      //数据库查询对应房间号
      SearchRoomID(id_to_search){  
        console.log("接收到的房间号：",id_to_search);
        const db = wx.cloud.database();
        db.collection('games').where({_id:id_to_search})  
        .get().then(res =>{
            if(res.data.length!=0){
                console.log('请求成功',res.data)
                this.setData({
                    //动态的将数据库中的数据存放到data中
                    jr_status:1,
                    // list:res.data,
                    cur_jr_rn:id_to_search,

                    });
                    //把当前用户openid加进数据库里
                    let item_info=res.data[0];
                    console.log(item_info);
                    // console.log(typeof item_info);
                    let ids=item_info.players_ids;
                    if ((!ids.find(item => item == this.data.openid))){
                        ids[ids.length]=this.data.openid;
                        console.log("现在ids更新为：",ids);
                        db.collection('games').doc(id_to_search).update({
                        // data 传入需要局部更新的数据
                        data: {
                            players_ids: ids
                        },
                              success: function(res) {
                                // success加上试试还报不报错 还是报错
                                console.log(res)
                            }
                        })
                        // .then(()=>{
                        //     const db = wx.cloud.database();
                        //     db.collection('games').doc(id_to_search)  
                        //     .get().then(res =>{console.log("现在games数据库里的玩家id列表更新为：",res.data.players_ids)});
                        // })
                        ;
                    }
                        else{
                            console.log("已经在游戏中啦");

                        }

                    //去游戏开始（等人）界面
                    let latest_room_num=this.data.cur_jr_rn;
                    wx.navigateTo({
                      url: '../game_started/game_started?room_num='+latest_room_num,
                    });
                }
                else{
                    this.setData({jr_status:2});
                    console.log("没有这个房间~"); 
                    
                }
          })  .catch(err =>{
            this.setData({jr_status:3});
            console.log('请求失败',err);
          })
        
        },

      GetRoom(e){
        // console.log(e);
        let profile_got=Promise.resolve(this.getUserProfile());
        profile_got.then(()=>{this.GetPlayerInfo(e)});
        let cur_rm_num=parseInt(e.detail.value);
        console.log(cur_rm_num);
        if(cur_rm_num){this.setData({cur_input_rn:cur_rm_num})};
    }
})