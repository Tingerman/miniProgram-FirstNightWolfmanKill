// pages/gaming.js
Page({

    /**
     * 页面的初始数据
     */
    data: {
        room:0,
        step:1,
        // step2_all_ready:false,
        cur_step2_ready_num:0,
        step2_ready:false,
        step2_all_ready:false,

        cur_step3_ready_num:0,
        step3_ready:false,
        step3_all_ready:false,
        
        // 身份分发逻辑：比如12人局，1-12按roles顺序编排身份，比如狼枪守卫板子，1-12分别是：狼王 预女猎守 民民民民 狼狼狼，给每个玩家分配一个号码，抽到对应身份，在games表里存一个新的字段"gaming",存放号码、身份、玩家id、是否存活 等 信息
        roles:[],  //从数据库里拿取的游戏配置信息
        roles_index_list:[],  //处理过的，本局游戏存在的角色，按数量，村民普狼有重复，0-9
        player_ids:[],  //从上个页面里拿取的玩家id列表
        shuffled_ids:[],  //洗牌后玩家id列表
        player_info:[],  //从上个页面里拿取的玩家信息列表
        gaming:[],

        num:0,  //本局游戏人数
        wolves:0,  //狼人团队总数

        openid:"",  //当前用户的openid
        creator:"",  //当前房间房主的openid
        cur_number:100, //当前用户对应的游戏玩家编号
        cur_role_id:100,  //当前用户对应的角色id（从0开始）

        //首夜信息 按gaming的number来，数据库统一，从1开始
        fn_killed:100,
        fn_healed:100,
        fn_poisoned:100,
        fn_investigated:100,
        fn_guarded:100,

        //首夜信息 按player_info的index来，页面内部的临时变量，从0开始
        temp_fn_killed:100,
        temp_fn_healed:100,
        temp_fn_poisoned:100,
        temp_fn_investigated:100,
        temp_fn_guarded:100,

        fn_inv_ans:"还没验出来呢", //首夜查验结果，好人/狼人
        investigating:false,
        fn_inv_nn:"",
        fn_killed_nn:"",

        nw_killed:false, //女巫是否首夜中刀
        showDu:false,  //女巫选择不救人，显示撒毒选项

        //首夜信息
        fn_info:[],  //死亡玩家的id，数组
        lr_poisoned:false,  //猎人被毒（不能开枪）
        lw_poisoned:false,  //狼王被毒（不能开枪）
        blw_poisoned:false,  //白狼王被毒（不能使用技能）
        showInfo:false,
        info_str:"",
        info_nn:[], // 首夜死亡玩家的昵称列表

        //后面要收到信息继续当上帝的人
        next_god:100,
        temp_god:100,
        god_nn:"",

        all_info_str:"",
        showAllInfo:false

    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        wx.cloud.init();
        if (wx.getUserProfile) {
          this.setData({
            canIUseGetUserProfile: true
          })
        }
        console.log("options:",options);
        //获取上一个页面留下的房间号数据
        this.setData({
            room:parseInt(options.room_num)});
            if(options.cur_number){
                this.setData({
                    cur_number:parseInt(options.cur_number),
                    cur_role_id:parseInt(options.cur_role_id)
                })
            }
            // player_ids:parseInt(options.cur_plyr_ids),
            // player_info:parseInt(options.cur_players)

        this.GetID();
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

        setTimeout(()=>{
            //如果数据库里已经有洗牌、发牌数据，则跳过loaddata
            const db = wx.cloud.database();
            db.collection('games').where({_id:this.data.room})
                .get().then(res =>{
                      this.setData({creator:res.data[0]._openid});
                    setTimeout(() => {                    
                        if(res.data[0].gaming&&res.data[0].gaming[0]&&res.data[0].shuffled_ids&&res.data[0].shuffled_ids.length){
                            console.log("查找到的当前游戏的（含有gaming）数据",res.data[0]);
                            this.setData({
                                gaming:res.data[0].gaming,
                                shuffled_ids:res.data[0].shuffled_ids
                            });

                            this.setData({roles:res.data[0].roles_arr});
                            this.setData({num:res.data[0].player_num});
                            this.setData({wolves:res.data[0].wolves_num});
                            this.setData({player_ids:res.data[0].players_ids});
                            this.setData({
                                fn_killed:res.data[0].fn_killed,
                                fn_investigated:res.data[0].fn_investigated,
                                fn_guarded:res.data[0].fn_guarded,
                                fn_healed:res.data[0].fn_healed,
                                fn_poisoned:res.data[0].fn_poisoned,
                            });
                            if(res.data[0].fn_killed && res.data[0].fn_killed!=100){
                                let id=this.data.gaming[this.data.fn_killed-1].player;
                                db.collection('players').doc(id).get().then(res=>{
                                    this.setData({fn_killed_nn:res.data.plr_nickname});
                                })
                            }
                            console.log("本局游戏配置：",this.data.roles);

                            for(var i=0;i<res.data[0].gaming.length;i++){
                                console.log("当前openid",this.data.openid);
                                if(res.data[0].gaming[i].player==this.data.openid){
                                    this.setData({cur_number:res.data[0].gaming[i].number});
                                    this.setData({cur_role_id:res.data[0].gaming[i].role_index});
                                    break;
                                }
                            }
                            setTimeout(() => {
                                this.getPlayerList(this.data.player_ids);
                            }, 500);
                        }
                        //没有gaming数据，则loadData
                        else{
                            console.log("新建gaming数据中");
                        }
                    },500);
                });
        },200);

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
        //离开页面时把当前用户的“就绪”取消掉
        // const db = wx.cloud.database();
        // if(!this.data.step2_ready){
        //     db.collection('games').doc(this.data.room).update({
        //         data: {
        //             step2_ready_num:this.data.cur_step2_ready_num-1
        //         }
        //     });
        // }
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

    reloadData(){
    },

    getPlayerList(ids) {
        console.log("gaming页的getPlayerList被调用啦！");
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

                let plyr_info={"id":element,"nickname":nickname,"avatarurl":avatarurl};
                if((!this.data.player_info.find(item => item.id== plyr_info.id))){
                    this.setData({[`player_info[${this.data.player_info.length}]`]:plyr_info});
                }

                console.log("gaming页的用户信息列表搞出来啦：",this.data.player_info);
            })
            
        })
        
    },

    shenFen(e){
        this.setData({step:2});
        console.log("当前用户本局的gaming号码：",this.data.cur_number);
        console.log(this.data.gaming);
        console.log("当前用户本局的身份id：",this.data.cur_role_id);
        console.log("当前用户本局的身份：",this.data.roles[this.data.cur_role_id]);

        //gaming信息写进数据库
        setTimeout(()=>{
            const db = wx.cloud.database();
            // console.log("room: ",this.data.room,typeof this.data.room);
            db.collection('games').doc(this.data.room)
                .update({
                    data:{
                        gaming:this.data.gaming,
                        shuffled_ids:this.data.shuffled_ids
                    }
                });     
                //加载就绪情况
                setTimeout(() => {
                    db.collection('games').doc(this.data.room).get().then(res=>{
                        this.setData({gaming:res.data.gaming});
                        this.setData({cur_step2_ready_num:res.data.step2_ready_num});
                        this.setData({step2_ready:res.data.gaming[this.data.cur_number-1].step2_ready});
                        if(res.data.step2_ready_num==this.data.num){
                            this.setData({step2_all_ready:true});
                        }
                    });
                }, 500);
            //循环加载就绪情况
            let interval=setInterval(() => {
            const db = wx.cloud.database();
            db.collection('games').doc(this.data.room).get().then(res=>{
                this.setData({gaming:res.data.gaming});
                this.setData({cur_step2_ready_num:res.data.step2_ready_num});
                if(res.data.step2_ready_num==this.data.num){
                    this.setData({step2_all_ready:true});
                }
                console.log("就绪情况还在循环刷新哦~",res.data.gaming,"就绪人数",res.data.step2_ready_num);
                console.log("当前step：",this.data.step);
                });

                //停止循环刷新就绪情况 不知道可不可以这样调用自己 可以！
                if(this.data.cur_step2_ready_num==this.data.num || this.data.step!=2){
                    clearInterval(interval);
                    
                }  
            }, 5000);     
        },500);
        
    },

    shenfenReady(e){
        this.setData({step2_ready:true});
        console.log("当前用户(数据库中取到的)step2_ready?",this.data.gaming[this.data.cur_number-1].step2_ready);
        let cur_step2_ready=this.data.gaming[this.data.cur_number-1].step2_ready;//0或1 number
        setTimeout(() => {
            if(!cur_step2_ready){
                this.setData({[`gaming[${this.data.cur_number-1}].step2_ready`]:1});
                // {[`gaming[${this.data.gaming.length}]`]:gaming_info}
                let ready_num=0;
                this.data.gaming.forEach(element => {
                    ready_num+=element.step2_ready;
                });
                this.setData({cur_step2_ready_num:ready_num});
                const db = wx.cloud.database();
                db.collection('games').doc(this.data.room).update({
                    data: {
                        step2_ready_num:this.data.cur_step2_ready_num,
                        gaming:this.data.gaming
                    }
                });
            }       
        }, 100);
    },

    first_night_lys(e){
        if((this.data.cur_role_id==2 && this.data.fn_investigated!=100)){
            this.setData({step:4});
        }
        else{
            this.setData({step:3});
            console.log("当前身份：",this.data.cur_role_id)
        }

    },

    fn_kill(e){
        console.log("看看第一天晚上狼人要杀哪个倒霉蛋");
        console.log(e);
        let kill_id=e.currentTarget.id;
        let kill_id_str = kill_id.replace(/[^\d]/g,' ');
        let killed=parseInt(kill_id_str);
        console.log(killed);
        this.setData({temp_fn_killed:killed});
        // 把临时性的index转化成gaming里的number
        let id=this.data.player_info[killed].id;
        for(let i=0;i<this.data.shuffled_ids.length;i++){
            if(this.data.shuffled_ids[i]==id){
                this.setData({fn_killed:i+1});  //number从1开始，要+1
            }
        }
    },

    fn_kill_confirm(e){
        const db = wx.cloud.database();
        db.collection('games').doc(this.data.room)
        .update({
            data:{
                fn_killed:this.data.fn_killed
            }
        });

        let id=this.data.gaming[this.data.fn_killed-1].player;
        db.collection('players').doc(id).get().then(res=>{
            this.setData({fn_killed_nn:res.data.plr_nickname});
        })
        
        this.setData({step:4});   
    },

    fn_inv(e){
        console.log("看看第一天晚上预言家要验哪个倒霉蛋");
        console.log(e);
        console.log(this.data.fn_investigated);
        if(this.data.fn_investigated==100){
            let inv_id=e.currentTarget.id;
            let inv_id_str = inv_id.replace(/[^\d]/g,' ');
            let inv=parseInt(inv_id_str);
            console.log(inv);
            this.setData({temp_fn_investigated:inv});
            // 把临时性的index转化成gaming里的number
            let id=this.data.player_info[inv].id;
            for(let i=0;i<this.data.shuffled_ids.length;i++){
                if(this.data.shuffled_ids[i]==id){
                    console.log(id);
                    this.setData({fn_investigated:i+1});  //number从1开始，要+1
                }
            }
            let r=this.data.gaming[this.data.fn_investigated-1].role_index;
            if(this.data.roles[r].type=="lang"){
                this.setData({fn_inv_ans:"狼人"});
            }
            else{
                this.setData({fn_inv_ans:"好人"});
            }

            const db = wx.cloud.database();
            db.collection('players').doc(id)
            .get().then(res =>{
                console.log("要查验的人：",res.data.plr_nickname);
                this.setData({fn_inv_nn:res.data.plr_nickname});
            });
        }
    },

    fn_investigating(e){
        this.setData({investigating:true})
    },

    fn_inv_confirm(e){
        this.setData({investigating:false});
        const db = wx.cloud.database();
        db.collection('games').doc(this.data.room)
        .update({
            data:{
                fn_investigated:this.data.fn_investigated
            }
        });
        this.setData({step:4});   
    },

    fn_guard(e){
        console.log("看看第一天晚上守卫守护的是哪位朋友~~~");
        console.log(e);
        let guard_id=e.currentTarget.id;
        let guard_id_str = guard_id.replace(/[^\d]/g,' ');
        let guard=parseInt(guard_id_str);
        console.log(guard);
        this.setData({temp_fn_guarded:guard});
        // 把临时性的index转化成gaming里的number
        let id=this.data.player_info[guard].id;
        for(let i=0;i<this.data.shuffled_ids.length;i++){
            if(this.data.shuffled_ids[i]==id){
                this.setData({fn_guarded:i+1});  //number从1开始，要+1
            }
        }
    },

    fn_guard_confirm(e){
        const db = wx.cloud.database();
        db.collection('games').doc(this.data.room)
        .update({
            data:{
                fn_guarded:this.data.fn_guarded
            }
        });
        this.setData({step:4});   
    },

    fn_other_confirm_1(e){
        this.setData({step:4});
        if(this.data.cur_role_id==3){
            const db = wx.cloud.database();
            db.collection('games').doc(this.data.room)
            .get().then(res=>{
                this.setData({fn_killed:res.data.fn_killed})
            });
            let id=this.data.gaming[this.data.fn_killed-1].player;
            db.collection('players').doc(id).get().then(res=>{
                this.setData({fn_killed_nn:res.data.plr_nickname});
            })
            if(this.data.fn_killed==this.data.cur_number){
                console.log("首夜刀中女巫，不能自救");
                this.setData({nw_killed:true});
            }

        }
    },

    fn_heal(e){
        const db = wx.cloud.database();
        db.collection('games').doc(this.data.room)
        .get().then(res=>{
            this.setData({fn_killed:res.data.fn_killed})
        });
        let id=this.data.gaming[this.data.fn_killed-1].player;
        db.collection('players').doc(id).get().then(res=>{
            this.setData({fn_killed_nn:res.data.plr_nickname});
        })
        if(this.data.fn_killed==this.data.cur_number){
            console.log("首夜刀中女巫，不能自救");
            this.setData({nw_killed:true});
        }

        console.log(e);
        console.log(e.detail.currentKey);
        let key=parseInt(e.detail.currentKey);
        if(key==1){
            if(!this.data.nw_killed){
                this.setData({fn_healed:this.data.fn_killed});
            }
        }
        else{
            this.setData({showDu:true});
        }
    },

    fn_heal_confirm(e){
        const db = wx.cloud.database();
        db.collection('games').doc(this.data.room)
        .update({
            data:{
                fn_healed:this.data.fn_healed
            }
        });
        if(this.data.openid==this.data.creator){
            this.gen_fn_info();
        }
        this.setData({step:5});   
    },

    fn_du(e){
        console.log("看看第一天晚上女巫要毒的是哪位倒霉蛋~~~");
        console.log(e);
        let du_id=e.currentTarget.id;
        let du_id_str = du_id.replace(/[^\d]/g,' ');
        let du=parseInt(du_id_str);
        console.log(du);
        this.setData({temp_fn_poisoned:du});
        // 把临时性的index转化成gaming里的number
        let id=this.data.player_info[du].id;
        for(let i=0;i<this.data.shuffled_ids.length;i++){
            if(this.data.shuffled_ids[i]==id){
                this.setData({fn_poisoned:i+1});  //number从1开始，要+1
            }
        }
    },

    fn_du_confirm(e){
        const db = wx.cloud.database();
        db.collection('games').doc(this.data.room)
        .update({
            data:{
                fn_poisoned:this.data.fn_poisoned
            }
        });
        if(this.data.openid==this.data.creator){
            this.gen_fn_info();
        }
        this.setData({step:5});   
    },

    fn_other_confirm_2(e){
        if(this.data.openid==this.data.creator){
            this.gen_fn_info();
        }
        this.setData({step:5});
    },


    gen_fn_info(){
        const db = wx.cloud.database();
        db.collection('games').doc(this.data.room)
        .get().then(res=>{
            this.setData({
                fn_killed:res.data.fn_killed,
                fn_guarded:res.data.fn_guarded,
                fn_investigated:res.data.fn_investigated,
                fn_healed:res.data.fn_healed,
                fn_poisoned:res.data.fn_poisoned,
            });
        });
        if(this.data.fn_killed!=100){
            //被救
            if(this.data.fn_killed==this.data.fn_healed){
                //同守同救
                if(this.data.fn_killed==this.data.fn_guarded){
                    this.setData({[`fn_info[${this.data.fn_info.length}]`]:this.data.fn_killed})
                }
            }
            else{
                //没被救
                this.setData({[`fn_info[${this.data.fn_info.length}]`]:this.data.fn_killed})
            }
        }
        //撒毒
        if(this.data.fn_poisoned!=100){
            this.setData({[`fn_info[${this.data.fn_info.length}]`]:this.data.fn_poisoned})
        }

        //生成字符串格式
        if (this.data.fn_info.length==0 ||(!this.data.fn_info[0]) && (!this.data.fn_info[1])){
            this.setData({info_str:"平安夜"});
        }
        else{
            console.log(this.data.fn_info)
            this.data.fn_info.forEach(element => {
                let id=this.data.gaming[element-1].player;
                db.collection('players').doc(id).get().then(res=>{
                    this.setData({[`info_nn[${this.data.info_nn.length}]`]:res.data.plr_nickname});
                })
            });
            let str="";
            this.data.info_nn.forEach(element => {
                str=str+element+" ";
            });
            str+="死亡";
            this.setData({info_str:str});
        }


    },

    see_fn_info(e){
        this.setData({showInfo:true});
    },

    fn_night_end(e){
        const db = wx.cloud.database();
        db.collection('games').doc(this.data.room)
            .get().then(res =>{
                  this.setData({next_god:res.data.next_god});
            });

        if(this.cur_number==this.next_god){
            this.gen_all_info();
        }


        if(this.data.cur_role_id==4){
            const db = wx.cloud.database();
            db.collection('games').doc(this.data.room)
            .get().then(res=>{
                this.setData({fn_poisoned:res.data.fn_poisoned})
            });

            if(this.data.fn_poisoned==this.data.cur_number){
                console.log("猎人中毒");
                this.setData({lr_poisoned:true});
            }
            
        }

        if(this.data.cur_role_id==0){
            const db = wx.cloud.database();
            db.collection('games').doc(this.data.room)
            .get().then(res=>{
                this.setData({fn_poisoned:res.data.fn_poisoned})
            });

            if(this.data.fn_poisoned==this.data.cur_number){
                console.log("狼王中毒");
                this.setData({lw_poisoned:true});
            }
            
        }

        if(this.data.cur_role_id==1){
            const db = wx.cloud.database();
            db.collection('games').doc(this.data.room)
            .get().then(res=>{
                this.setData({fn_poisoned:res.data.fn_poisoned})
            });

            if(this.data.fn_poisoned==this.data.cur_number){
                console.log("白狼王中毒");
                this.setData({blw_poisoned:true});
            }
            
        }

        this.setData({step:6});
    },

    bcm_god(e){
        console.log("看看哪位玩家被投出去了，成为新上帝~~~");
        console.log(e);
        let god_id=e.currentTarget.id;
        let god_id_str = god_id.replace(/[^\d]/g,' ');
        let god=parseInt(god_id_str);
        console.log(god);
        this.setData({temp_god:god});
        // 把临时性的index转化成gaming里的number
        let id=this.data.player_info[god].id;
        for(let i=0;i<this.data.shuffled_ids.length;i++){
            if(this.data.shuffled_ids[i]==id){
                this.setData({next_god:i+1});  //number从1开始，要+1
            }
        }

        const db = wx.cloud.database();
        db.collection('players').doc(id).get().then(res=>{
            this.setData({god_nn:res.data.plr_nickname});
        })

        //next_god 上传数据库
        db.collection('games').doc(this.data.room)
        .update({
            data:{
                next_god:this.data.next_god
            }
        });
    },

    gen_all_info(e){
        const db = wx.cloud.database();
        db.collection('games').doc(this.data.room)
        .get().then(res=>{
            this.setData({
                fn_killed:res.data.fn_killed,
                fn_guarded:res.data.fn_guarded,
                fn_investigated:res.data.fn_investigated,
                fn_healed:res.data.fn_healed,
                fn_poisoned:res.data.fn_poisoned,
            });
        });
        let gaming_str="";
        this.data.gaming.forEach(element => {
            let id=element.player;
            let role=this.data.roles[element.role_index].role;
            var item="";
            db.collection('players').doc(id).get().then(res=>{
                item+=res.data.plr_nickname+"："+role;
                console.log("item:",item);

                if(element.number==this.data.fn_poisoned){
                    item+="，被刀";
                }
                if(element.number==this.data.fn_guarded){
                    item+="，被守护";
                }
                if(element.number==this.data.fn_investigated){
                    item+="，被查验";
                }
                if(element.number==this.data.fn_healed){
                    item+="，被救活";
                }
                if(element.number==this.data.fn_poisoned){
                    item+="，被毒";
                }
            }).then(()=>{
                item+="; "
                gaming_str+=item;
                console.log("gaming_str：",gaming_str);
            }).then(()=>{
                this.setData({all_info_str:gaming_str});
            })
        });


    },

    all_info(e){
        this.setData({showAllInfo:true});
    },

    exit(e){
        wx.navigateTo({
            url: '../welcomepage/welcomepage'
        })
    }


})
