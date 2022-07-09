// 获取应用实例
const app = getApp()


Page({
  data: {
    motto: '欢迎~',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    canIUseGetUserProfile: false,
    canIUseOpenData: wx.canIUse('open-data.type.userAvatarUrl') && wx.canIUse('open-data.type.userNickName') ,// 如需尝试获取用户信息可改为false
    latest_room:0,
    plr_num:0,  //游戏所需人数，为了少跑一次数据库，从GetPlayerIDs()里一并取了
    cur_plyr_num:0,  //当前已经加入的玩家人数

    openid:"",  //当前用户的openid
    creator:"",  //当前房间房主的openid

    // 身份分发逻辑：比如12人局，1-12按roles顺序编排身份，比如狼枪守卫板子，1-12分别是：狼王 预女猎守 民民民民 狼狼狼，给每个玩家分配一个号码，抽到对应身份，在games表里存一个新的字段"gaming",存放号码、身份、玩家id、是否存活 等 信息
    roles:[],  //从数据库里拿取的游戏配置信息
    roles_index_list:[],  //处理过的，本局游戏存在的角色，按数量，村民普狼有重复，0-9
    shuffled_ids:[],  //洗牌后玩家id列表
    gaming:[],
    cur_players:[],  //当前对局的玩家信息,对象数组，包括openid，nickname，avatarurl
    cur_plyr_ids:[],  //当前对局玩家id列表，仅存id
    num:0,  //本局游戏人数
    wolves:0,
    player_ids:[],  //开局时的玩家列表

    cur_number:100,
    cur_role_id:100,

    not_open_yet:true, //房主还没点开局

    waiting:false,



    interval: "",  //停止循环刷新用的变量
    interval_checkOpen:""


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

  // 事件处理函数
  bindViewTap() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },


  onLoad(options) {
    this.GetID;
    wx.cloud.init();
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      })
    }
    console.log(options);
    //获取上一个页面留下的房间号数据
    this.setData({
        latest_room:parseInt(options.room_num)
      });

      this.getPlayerIDs();
  },

  onUnload() {
    //页面销毁停止运行
    let that = this;
    clearInterval(that.data.interval);
  },

  onReady() {

  },

onShow() {
  this.GetID();
  this.getPlayerIDs();
  this.check_open();
  const db = wx.cloud.database();
  console.log("latestroom: ",this.data.latest_room,typeof this.data.latest_room);
  db.collection('games').doc(this.data.latest_room)
      .get().then(res =>{
        this.setData({creator:res.data._openid})
      });
  let sw=setTimeout(()=>{
    this.getPlayerList(this.data.cur_plyr_ids);
  },2500);
  setTimeout(()=>{
      console.log("当前用户ids：",this.data.cur_plyr_ids);
      console.log("当前用户：",this.data.cur_players);
  },4000);

  this.setData({
    interval:
    setInterval(() => {
      this.getPlayerIDs();
      setTimeout(()=>{
        this.getPlayerList(this.data.cur_plyr_ids);
    },2500);
    setTimeout(()=>{
        console.log("当前用户ids：",this.data.cur_plyr_ids);
        console.log("当前用户：",this.data.cur_players);
    },4000);
    }, 10000),

    interval_checkOpen:
    setInterval(() => {
      this.check_open();
      if(!this.data.not_open_yet){
        clearInterval(this.data.interval_checkOpen);
      }
    }, 10000)
    
  });
  

},


  getUserProfile(e) {
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
  getUserInfo(e) {
    // 不推荐使用getUserInfo获取用户信息，预计自2021年4月13日起，getUserInfo将不再弹出弹窗，并直接返回匿名的用户个人信息
    console.log(e)
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },

  async getPlayerIDs(){
    let result=[];
    console.log("getPlayerIDs被调用啦！");
    const db = wx.cloud.database();
    console.log("latestroom: ",this.data.latest_room,typeof this.data.latest_room);
    db.collection('games').doc(this.data.latest_room)
        .get().then(res =>{
            // console.log("res",res.data);
            this.setData({cur_plyr_ids:res.data.players_ids});
            result=res.data.players_ids;
            console.log(res.data.players_ids);

            //顺便调取游戏所需人数 plr_num 和当前已经加入人数 cur_plr_num
            this.setData({plr_num:parseInt(res.data.player_num)});
            this.setData({cur_plr_num:res.data.players_ids.length});
        })
        .then(()=>{
            console.log("cur_plyr_ids",this.data.cur_plyr_ids,this.data.cur_plyr_ids.length);
            console.log("cur_plr_num",this.data.cur_plr_num);
            console.log("plr_num",this.data.plr_num);
    });
        // .then(()=>{return result;});
    // 排查异步用的返回值

    },

    getPlayerList(ids) {
        console.log("getPlayerList被调用啦！");
        //forEach是异步循环，不按顺序
        ids.forEach(element => {
            console.log("id:",element);
            const db = wx.cloud.database();
            let nickname="";
            let avatarurl="";
            db.collection('players').doc(element)
            .get().then(res =>{
                console.log("查找用户的res",res);
                nickname=res.data.plr_nickname;
                avatarurl=res.data.plr_avatarurl;

                console.log(nickname,avatarurl);

                let plyr={"id":element,"nickname":nickname,"avatarurl":avatarurl};
                if((!this.data.cur_players.find(item => item.id== plyr.id))){
                    this.setData({[`cur_players[${this.data.cur_players.length}]`]:plyr});
                }

                console.log("用户信息列表搞出来啦：",this.data.cur_players);
            })
            
        }
)
        
    },


  back(e){
      wx.navigateBack({
        delta: 0,
      })
  },

  startGame(e){
    clearInterval(this.data.interval);
    clearInterval(this.data.interval_checkOpen);
    this.setData({waiting:true});

    //查看数据库里有没有gaming数据了
    const db = wx.cloud.database();
    db.collection('games').doc(this.data.latest_room)
        .get().then(res =>{
          if(!res.data.shuffled_ids || res.data.shuffled_ids.length==0){
            //分发身份       
            this.shuffle();
            setTimeout(() => {
              wx.navigateTo({
                // url: '../gaming/gaming?room_num='+this.data.latest_room+'？cur_plyr_ids='+this.data.cur_plyr_ids+'？cur_players='+this.data.cur_players,
                url: '../gaming/gaming?room_num='+this.data.latest_room+'&cur_number='+this.data.cur_number+'&cur_role_id='+this.data.cur_role_id,
                
              });
              console.log("洗好牌了，跳转中");
            }, 5000);
          }
          else{
            wx.navigateTo({
              url: '../gaming/gaming?room_num='+this.data.latest_room,
            });
            console.log("游戏数据已存在，跳转中");
          }
        });
  },

  shuffle(){
    //取数据
    const db = wx.cloud.database();
    console.log("loading data... room: ",this.data.latest_room,typeof this.data.latest_room);
    db.collection('games').doc(this.data.latest_room)
        .get().then(res =>{
            // console.log("res",res.data);
            this.setData({roles:res.data.roles_arr});
            this.setData({num:res.data.player_num});
            this.setData({wolves:res.data.wolves_num});
            this.setData({player_ids:res.data.players_ids});
            console.log("本局游戏配置：",this.data.roles);
        });
    
    setTimeout(()=>{
        //洗牌：对玩家数组和编号的随机排序 注意全程只洗这一次
        const shuffled=this.data.player_ids.sort(function () {
            return Math.random() - 0.5
        });
        this.setData({shuffled_ids:shuffled});
        console.log("洗牌中");
    },2000);


    setTimeout(()=>{
        this.setRolesIndexList(this.data.roles);

        if(this.data.gaming.length<=this.data.num){
            for(var plyr=1;plyr<=this.data.num;plyr++){
                let gaming_index=plyr-1;
                let player=this.data.shuffled_ids[gaming_index]; //已经洗过牌了
                let role_index=this.data.roles_index_list[gaming_index];
                let gaming_info={"number":plyr,"player":player,"role_index":role_index,"step2_ready":0};

                this.setData({[`gaming[${this.data.gaming.length}]`]:gaming_info});

            }
            
        }
        setTimeout(()=>{
            this.data.gaming.forEach(element => {
                if (element.player==this.data.openid){
                    this.setData({cur_number:element.number});
                    this.setData({cur_role_id:element.role_index});
                } 
            });
        },2000);

        //gaming信息写进数据库
        setTimeout(() => {
          const db = wx.cloud.database();
          // console.log("room: ",this.data.room,typeof this.data.room);
          db.collection('games').doc(this.data.latest_room)
              .update({
                  data:{
                      gaming:this.data.gaming,
                      shuffled_ids:this.data.shuffled_ids
                  }
              });
            }, 2000);

    },2500);        
  },

  setRolesIndexList(roles){
    let role_list=[];
    for(var r=0;r<roles.length;r++){
        let element=roles[r];
        let num_last=element.num;
        while(num_last!=0){
            role_list[role_list.length]=r;
            num_last--;
        }
    }

    console.log("角色编号",role_list);
    this.setData({roles_index_list:role_list});
  },

  joinGame(e){
    console.log("试图入局中...",this.data.not_open_yet)
    clearInterval(this.data.interval);
    //查看数据库里有没有gaming数据了
    if(this.data.not_open_yet==false){
      clearInterval(this.data.interval_checkOpen);
      wx.navigateTo({
          url: '../gaming/gaming?room_num='+this.data.latest_room,
        });

    }
  },

  check_open(){
    //查看数据库里有没有gaming数据了
    const db = wx.cloud.database();
    // while(this.data.not_open_yet){
      // this.setData({not_open_yet:false}); //不在这里关掉就直接死循环，根本进不了查询
      console.log("看看while里数据库查询外行不行（not_open_yet）:",this.data.not_open_yet)
      db.collection('games').doc(this.data.latest_room)
          .get().then(res =>{
            console.log("查看res.data里有没有gaming",res.data);
            if(!res.data.gaming || !res.data.shuffled_ids||res.data.gaming.length==0){
              console.log("房主还没有点击开局,not_open_yet",this.data.not_open_yet);
            }
            else{
              this.setData({not_open_yet:false});
              clearInterval(this.data.interval);
            }

          });
        }




})