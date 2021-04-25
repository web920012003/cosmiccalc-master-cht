/*
 *  CosmiCalc - CosmicBreak assembly simulator with jQuery
 *
 *  Copyright (c) 2010 Nukms
 *
 *  Was maintained by koi
 *  Messed up by blead
 *
 *  Licensed under the MIT(MIT-LICENSE.txt) license.
 *
 */

/*  Naming Rules
 *
 *  CONST VARS:  WORD_WORD
 *  GLOBAL VARS: Word_word
 *  LOCAL VARS:  word_word
 *  FUNCTIONS:   wordWord
 *
 */

(function($, undefined){

/* CONST VARS */
var VERSION = "3.5.0",
	LAST_MODIFIED = "2021.01.22",
	LOCALSTORAGE_CONFIG_KEY = "_COSMICCALC",
	LOCALSTORAGE_VERSION_KEY = LOCALSTORAGE_CONFIG_KEY + "_VERSION",

	CODEW_URL = "http://blead.github.io/cosmiccalc/",
	
	MAXLEVEL_DEF = 10;
	ADDLEVEL_DEF = 0;
	
	MAXLEVEL = MAXLEVEL_DEF;
	ADDLEVEL = ADDLEVEL_DEF;
	
	INI_FILE_NAME = "cosmicalc.ini",
	WB_DEF_FILE_NAME = "defaultwb",
	CARTRIDGE_MASTER_FILE_NAME = "cartridge",
	MATERIAL_MASTER_FILE_NAME = "material",
	TUNEUP_FILE_NAME = "tuneup",
	SCROLL_OFFSET = 70,
	MESSAGE_DEF_TIME = 3000,	// [msec]
	MESSAGE_WARNING_TIME = 30000,	// [msec]
	MESSAGE_ERROR_TIME = 300000,	// [msec]
	MAX_DATA_SIZE = 1000000,

	TYPE_TO_CLASS = {
		"-":"",
		"陸":".riku",
		"空":".ku",
		"砲":".hou",
		"補":".ho"
	},

	SIZE_TO_CLASS = {
		"-":"",
		SS:".siz_m, .siz_l, .siz_ll",
		S:".siz_l, .siz_ll",
		M:".siz_ss, .siz_ll",
		L:".siz_ss, .siz_s",
		LL:".siz_ss, .siz_s, .siz_m"
	},

	SIZE_TO_NUMLIC = {
		"-":"",
		SS:0,
		S:1,
		M:2,
		L:3,
		LL:4
	},

	COMPRESS_CHARS = "abcdefghijklmnopqrstvwxyz",

	PARTS_DATA_DEF = {
		fixed: {slot: 3},
		bd: {
			wbid: 0,
			cartridge: {hpup:0,lv1:"",lv6:"",lv9:""}
		},
		wb: {type:"lacs",size:"-"},
		hd: {
			type: "lacs",
			size: "-",
			slot: 3,
		},
		lg: {
			type: "lacs",
			size: "-",
			slot: 3,
			builtin: {lg:1}
		},
		bs: {
			type: "lacs",
			size: "-",
			slot: 3,
			builtin: {bs:1}
		},
		am: {
			type: "lacs",
			size: "-",
			slot: 3,
		},
		wp: {type:"lacs",size:"-",slot:3},
		hdac: {type:"lacs",size:"-",slot:3},
		fcac: {type:"lacs",size:"-",slot:3}
	},

	JOINT_DEF = {
		bd:{joint:{wb:1,lg:1,bs:1,hd:1,am:2}},
		hd:{joint:{hdac:1,fcac:1}},
		am:{joint:{wp:1}}
	},

	INI = {
		browsercheck:0,
		webAccess:0,
		accessData:[],
		timeout:15000,
		dataFolder:"data/",
		henkan:false,
		mapInitMax:60,
		//maxDataSize:200000,
		//maxErrorCount:100,
		loadSaveData:false
	};

/* GLOBAL VARS */
var Parts_none = {
		name: "-",
		type: "-",
		size: "-",
		cost: 0,
		capa: 0,
		hp: 0,
		str: 0,
		tec: 0,
		wlk: 0,
		fly: 0,
		tgh: 0,
		slot: 0,
		cartridge: {hpup:0}
	},
	Parts_data = {
		fixed: [],
		bd: [],
		wb: [],
		hd: [],
		lg: [],
		bs: [],
		am: [],
		wp: [],
		hdac: [],
		fcac: []
	},
	Parts_data_base = {
		fixed: {},
		bd: {},
		wb: {},
		hd: {},
		lg: {},
		bs: {},
		am: {},
		wp: {},
		hdac: {},
		fcac: {}
	},
	Parts_data_overrides_str = {
		fixed: {},
		bd: {},
		wb: {},
		hd: {},
		lg: {},
		bs: {},
		am: {},
		wp: {},
		hdac: {},
		fcac: {}
	},

	Result = {
		type:"-",
		size:"-",
		cost:0,
		capa:0,
		hp:0,
		str:0,
		tec:0,
		wlk:0,
		fly:0,
		tgh:0,
		bs:0,
		lg:0,
		hd:0,
		am:0,
		wp:0,
		lv:0,
		reinforce:0
	};

var Master = {
	material: [],
	tuneup: [],
	cartridge: [],
	defaultwb: []
};
Master.cartridge.ex = [];
var Selected_cartridge = [];

var Settings = {
	coefficient: {	//ダメージ係数1000倍
		tec: 16,
		str: 24
	},
	save_slot: 0
};
var Assembly = {
	robo_name:{},
	bd:{},
	wb:{},
	cartridge:{}
};

var Prop = {
	target: {},
	changed: false
};
var Template = {};
var pdvTimer = 0;
//var Images = [];
var Message;

var Res_elms,
	PDV_elms,
	List_elms;

var Narrow_down = {
	pointer: 0,
	expr: [],
	operand: ">=",
	ctrg: [],
	ms: "m",
	type: "l",
	size: "M"
};

var UnRedo = function(trg, deep){
	UnRedo.r_stack = [];
	$("#REDO").addClass("disabled");
	UnRedo.set(1, trg, deep);
};
$.extend(UnRedo, {
	u_stack: [],
	r_stack: [],
	exec: function(ur){
		var stack = ur ? this.u_stack : this.r_stack, ccd = stack.pop();
		if(!stack.length) $(ur ? "#UNDO" : "#REDO").addClass("disabled");
		this.set(!ur, ccd[0].target, ccd.length>1 ? 1 : 0);
		
		
		
		if(ccd[0].target.ccd.part == "bd"){
			if(ccd[0].ref.name != "-"){
				$("#EXEC_AURA_SYSTEM")[ccd[0].ref.auraSystem ? "show" : "hide"]().removeClass("active");
				Assembly.wb.def = Master.defaultwb[ccd[0].ref.wbid]+"(default)";
				Assembly.wb.sb.value = Assembly.wb.def;
				Assembly.cartridge = ccd[0].ref.cartridge;
				makeCartridgeLst();
			}else{
				Assembly.cartridge = {hpup:0};
				$("#CTRG_LIST_CONTAINER").empty();
				$("#CURRENT_LV").text(ADDLEVEL+"/"+MAXLEVEL);
				Result.lv = ADDLEVEL;
				Selected_cartridge = [];
			}
		}

		setPartsData(ccd[0].target, ccd);

		calc();
		renewRes();
	},
	set: function(ur, trg, deep){
		var ccd = [], elm = deep ? $(".select_box:visible:not(.fixed)", trg.parentNode) : $(trg);
		elm.each(function(i){
			ccd[i] = {target:this, ref:this.ccd.parts_ref, slt:[]};
			$.each(this.ccd.slot||[], function(){
				ccd[i].slt.push(this.ccd.tune_ref);
			});
		});
		this[ur ? "u_stack" : "r_stack"].push(ccd);
		$(ur ? "#UNDO" : "#REDO").removeClass("disabled");
	}
});

$.fn.extend({
	setClass: function(className){
		return this.each(function(){
			this.className = className;
		});
	},
	clearPartData: function(txt){
		$(".select_box", this).each(function(){
			this.value = txt || "-";
			this.className = "select_box" + (this.ccd.part == "wb" ? " bltin_wb" : "") + (txt ? " fixed" : "");
			this.readOnly = txt ? true : false;
			this.ccd.parts_ref = Parts_none;
			this.ccd.tuned = Parts_none;
			$(this.ccd.slot).clearTuneData().hide();
		});
		$(".branch", this).hide();
		return this;
	},
	clearTuneData: function(){
		return this.each(function(){
			this.className = "slot";
			this.ccd.tune_ref = Parts_none;
		});
	},
	setTuneData: function(slot){
		$.each(this[0].ccd_sb.ccd.slot, function(i){
			if(slot[i]){
				if(typeof slot[i] == "object"){
					this.className = "slot tune"+slot[i].target;
					this.ccd.tune_ref = slot[i];
				}else if(Master.tuneup[slot[i]]){
					this.className = "slot tune"+Master.tuneup[slot[i]].target;
					this.ccd.tune_ref = Master.tuneup[slot[i]];
				}
			}
		});
		this.partCalc();
		return this;
	},
	partCalc: function(){
		var ccd = this[0].ccd_sb.ccd, pd = ccd.tuned = $.extend(true, {add:{}}, ccd.parts_ref), effect = [{},{}];
		if(ccd.parts_ref.auraStat){
			pd.auraStat = ccd.tuned.auraStat = $.extend(true, {add:{}}, ccd.parts_ref.auraStat);
			var auraTrg = [pd.auraStat.main,pd.auraStat.sub];
		}
		$.each(ccd.slot, function(i){
			var tud = this.ccd.tune_ref;
			if(!tud.type || tud.type.indexOf(Result.type)>-1){
				for(var i in tud) if(typeof tud[i] == "number"){
					pd.add[i] = (pd.add[i] || 0) + tud[i];
					if(ccd.parts_ref.auraStat) pd.auraStat.add[i] = (pd.auraStat.add[i] || 0) + tud[i];
				}
			}

			switch(tud.target){
			case "mwp":
				effect[0].trg = pd.main;
				for(var i in tud.effect) effect[0][i] = (effect[0][i] || 0) + (tud.effect[i] || 0);
				break;
			case "pwp":
				effect[1].trg = pd.sub;
				for(var i in tud.effect) effect[1][i] = (effect[1][i] || 0) + (tud.effect[i] || 0);
				break;
			default:
				break;
			}
		});

		for(var i in effect){
			for(var j in effect[i])
				switch(j){
				case "pwr":
				case "rng":
				case "shl":
					for(var k in effect[i].trg[j]) effect[i].trg[j][k] = Math.ceil(effect[i].trg[j][k] * (100 + effect[i][j]) / 100);
					if(ccd.parts_ref.auraStat) auraTrg[i][j][0] = Math.ceil(auraTrg[i][j][0] * (100 + effect[i][j]) / 100);
					break;
				case "spd":
					for(var k in effect[i].trg[j]) effect[i].trg[j][k] = parseInt(effect[i].trg[j][k] * (100 + effect[i][j]) / 100);
					if(ccd.parts_ref.auraStat) auraTrg[i][j][0] = parseInt(auraTrg[i][j][0] * (100 + effect[i][j]) / 100);
					break;
				default:
					break;
				}
		}

		return this;
	},
	checkSlot: function(){
		// ジョイントパーツの場合の制限（AM→AMJ や LG→LGJ 等の場合
		var prt = this[0].ccd_sb.ccd.part, pd = this[0].ccd_sb.ccd.parts_ref;
		if(pd.jointPart) $(".slot."+prt).clearTuneData();

		// スロット数に応じた処理
		var slotnum = pd.slot,
			m = pd.tunable && pd.tunable.mwp ? "" : "tunemwp",
			p = pd.tunable && pd.tunable.pwp ? "" : "tunepwp";
			ex = pd.tunable && pd.tunable.ex ? "" : "tuneex";
		$.each(this[0].ccd_sb.ccd.slot, function(i){
			if(i < slotnum){
				$(this).show()
					.filter((m ? "."+m : "") + (m && p ? "," : "") + (p ? "."+p : "") + (ex ? "."+ex:" ") + (m && ex ? "," : "")+ (p && ex ? "," : "") + (m && p && ex ? "," : "")).clearTuneData(); 
					//todo: ex tunes should not disappear when main/sub combo part is selected
			}else{
				$(this).hide().clearTuneData();
			}
		});
		return this;
	},
	controlJoint: function(ccd){
		var pd = this[0].ccd_sb.ccd.parts_ref, elm = this, b = "wb";
		$.each("wb,hdac,fcac,lg,hd,bs,am,wp".split(","), function(i, p){
			var n = pd.joint && pd.joint[p] || 0, up = p.toUpperCase(), blen = elm.children(".part_"+b).length;

			for(var len = elm.children(".part_"+p).length; len < n; len++){
				var trg = len ? ".part_"+p+":last" : (blen ? ".part_"+b+":last" : ".branch_line:first");
				trg = elm.children(trg);
				$(Template).clone(true).addClass("part_"+p).prepend("<img class=\""+p+"_img sprite sprite_22\" title=\""+p.toUpperCase()+"\">").each(function(){
                //$(Template).clone(true).addClass("part_" + p).prepend(Images[p.toUpperCase()].cloneNode(true)).each(function () {
						var self = this;
						this.ccd_sb = $(this).children(".select_box").each(function(){
							this.value = "-";
							this.ccd = {
								part: p,
								slot:[],
								list: $("#LIST_"+up)[0],
								parts_ref: Parts_none,
								tuned: Parts_none
							};
						}).get(0);
						$(this).children(".slot").each(function(){
							this.ccd_sb = self.ccd_sb;
							this.ccd_sb.ccd.slot.push(this);
							this.ccd = {tune_ref: Parts_none};
						});
					}).insertAfter(trg).show();
			}

			elm.children(".part_"+p).each(function(j){
				var el = $(this), fp = pd.fixedParts && pd.fixedParts[p] || [];
				if(j < n){
					el.show();
					if(j<fp.length){
						var pdf, fp_name = typeof fp[j]=="object" ? fp[j].name : fp[j];
						if(typeof fp[j]=="object"){
							pdf = fp[j];
							this.ccd_sb.className = "select_box fixed"+msToClass(pdf);
							this.ccd_sb.readOnly = true;
							this.ccd_sb.value = pdf.name;
							this.ccd_sb.ccd.parts_ref = pdf;
							this.ccd_sb.ccd.tuned = $.extend(true, {}, pdf);
						}else{
							el.clearPartData(fp_name);
							if(p=="hd") this.ccd_sb.ccd.parts_ref = $.extend(true, {joint:{hdac:1, fcac:1}}, Parts_none);
							if(p=="am") this.ccd_sb.ccd.parts_ref = $.extend(true, {joint:{wp:1}}, Parts_none);
						}
						el.controlJoint().checkSlot();
					}else{
						if($(this.ccd_sb).is(".fixed")) el.clearPartData();
						else el[pd.jointPart ? "addClass" : "removeClass"]("except_joint");
						if($.isArray(ccd) && ccd.length) setPartsData(this.ccd_sb, ccd);
					}
				}else{
					el.hide().clearPartData();
				}

				b = p;
			});

		});

		return this;
	},
	dummy: function(){return this;}
});

/* パーツアイコン プレロード */
/*$.each("HD,BS,LG,AM,WP,HDAC,FCAC".split(","), function(i, n){
	Images[n] = new Image();
	//Images[n].src = "img/"+n+"ico.gif";
	Images[n].title = Images[n].alt = n;
});*/

/* CosmiCalc Init処理 */
$(function(){

$("#VERSION").text("CosmiCalc Ver." + VERSION + " (Not updated for CBUNI)");
$("#LAST_MODIFIED").text(LAST_MODIFIED);

$.extend(Settings, {
	scroll_offset: SCROLL_OFFSET,
	left_offset: -parseInt($("#LIST_CONTAINER").outerWidth()/2)
});

Assembly = {
	robo_name:{
		container: $("#ROBO_NAME_CONTAINER")[0],
		elm: $("#ROBO_NAME")[0],
		text: ""
	},
	bd:{
		elm: $(".part_bd")[0],
		sb: $(".part_bd > .select_box")[0]
	},
	wb:{
		elm: $(".part_wb")[0],
		sb: $(".part_wb > .select_box")[0]
	}
};

Template = $("#PARTS_TEMPLATE > .branch")[0];

Res_elms = new function(){
	var p = this;
	$.each("cost,capa,type,size,hp,str,tec,wlk,fly,tgh".split(","), function(i, n){
		var c = p[n] = {};
		c.self = $("#RES_"+n.toUpperCase());
		c.current = c.self.find(".res_current_val");
		c.add = c.self.find(".res_add_val");
		c.graph = c.self.find(".res_graph");
	});
	p = this.check = {container: $("#JUDGE_SORTIE")};
	p.cost = p.container.find("#CHECK_COST .check_val");
	p.bs = p.container.find("#CHECK_BS .check_val");
	p.lg = p.container.find("#CHECK_LG .check_val");
};

PDV_elms = new function(){
	var p = this;
	p.container = $("#PARTS_DATA_VIEW");
	$.each("cost,capa,type,size,hp,str,tec,wlk,fly,tgh".split(","), function(i, n){
		var c = p[n] = {};
		c.self = p.container.find("#PDV_"+n.toUpperCase());
		c.current = c.self.find(".pdv_val");
		c.add = c.self.find(".pdv_add_val");
	});

	p.main = {container: p.container.find("#PDV_WP_MAIN")};
	p.sub = {container: p.container.find("#PDV_WP_SUB")};
	$.each("pwr,shl,rng,spd,itv,dmg".split(","), function(i, n){
		for(j=0;j<2;j++){
			var ms = j ? "main" : "sub", c = p[ms][n] = {};
			c.self = p.container.find("#PDV_"+ms.toUpperCase()+"_"+n.toUpperCase());
			c.current = c.self.find(".pdv_wp_val");
		}
	});

	p.name = p.container.find("#PDV_NAME");
	p.comment = p.container.find("#PDV_COMMENT");
	p.comment.row = $('<div class=".comment_row"></div>');
	p.materials = p.container.find("#MATERIALS");

	p.damage_map = {
		tec: $("#TEC_DAMAGE_MAP")[0],
		str: $("#STR_DAMAGE_MAP")[0]
	}
};

List_elms = new function(){
	var p = this;
	p.container = $("#LIST_CONTAINER")[0];
	$.each("bd,wb,lg,hd,bs,am,wp,hdac,fcac,tune".split(","), function(i, n){
		p[n] = $("#LIST_"+n.toUpperCase())[0];
	});
};

/* メッセージ */
Message = $("#MESSAGE");
Message.set = function(msg, elv, time){
	if(elv == undefined){
		elv = 0;
		time = MESSAGE_DEF_TIME;
	}else{
		if(isNaN(time)){
			switch(elv){
			case 1:
				time = MESSAGE_WARNING_TIME;
				break;
			case 2:
				time = MESSAGE_ERROR_TIME;
				break;
			default:
				time = MESSAGE_DEF_TIME;
				break;
			}
		}
	}
	var elm = $('<div class="msg'+(['',' warning',' error'][elv])+'"></div>');
	if(typeof msg == "string"){
		elm.text(msg).appendTo(this);
		setTimeout(function(){elm.fadeOut(function(){elm.remove();elm=null;});}, time);
	}else if(typeof msg == "object" && msg.constructor == Array){
		var clone = [];
		for(var i=0; i<msg.length; i++){
			clone[i] = elm.clone().text(msg[i]).appendTo(this);
			setTimeout(function(){clone[i].fadeOut(function(){clone[i].remove();clone[i]=null;});}, time);
		}
		elm = null;
	}
};

/* Not going to store settings in INI file anymore. This is retarded */
/*
$.ajax({
	async: false,
	url: INI_FILE_NAME,
	success: function(data){
		data.replace(/\/\/[^\r?\n]+/g, "")
				.replace(/([a-zA-Z_]+) *= *([\w\/]+|\[\s*\w+(\s*,\s*\w+)*\s*\])/g, function(str, key, val){
					INI[key] = isNaN(val) ? val : val-0;
			}).replace(/([a-zA-Z_]+) *= *(\{[^\{\}]+\})/g, function(str, key, val){
				INI[key] = {};
				val.replace(/"([^\"]+)":"([^\"]+)"/g, function(s, k, v){
					INI[key][k] = v;
				});
			});
		if(typeof INI.accessData == "string"){
			var str = INI.accessData.substr(1, INI.accessData.length-2);
			INI.accessData = [];*/
//			$.each(str.split(/\s*,\s*/), function(i, str){
/*				INI.accessData[str] = 1;
//			});
//		}

		if(INI.browsercheck && !$.browser.mozilla && !$.browser.opera)
			alert("Browser unsupported.\nSomething might work wrong.");
	}
});*/


/* マスタ読み込み */
ajaxManager.set([
	{/* デフォルトWB読込 */
		file: WB_DEF_FILE_NAME,
		callback: function(){
			if(Master.defaultwb[this.id]) throw "Duplicate ID @598";
			Master.defaultwb[this.id] = this.name;
			Master.defaultwb[this.name] = this.id;
		}
	},{/* カートリッジマスタ読込 */
		file: CARTRIDGE_MASTER_FILE_NAME,
		callback: function(){
			if(Master.cartridge[this.id]) throw "Duplicate ID @605";
			Master.cartridge[this.id] = $.extend({}, this);
			Master.cartridge[this.name] = this.id;
			if(this.ex) Master.cartridge.ex.push(Master.cartridge[this.id]);
			else $('<li class="ndc_li" value="'+this.id+'"></li>').text(this.name).appendTo("#NDC_BODY");
		}
	},{/* 素材マスタ読込 */
		file: MATERIAL_MASTER_FILE_NAME,
		callback: function(){
			if(Master.material[this.id]) throw "Duplicate ID @614";
			Master.material[this.id] = this.name;
		}
	}
]);

// 'Duct tape' snippet to check conversion ID mismatches
var Conversions = [];
var checkConversions = function(){
	if(Conversions.length){
		$.each(Conversions,function(i,conversion){
			$.each(conversion.split(" "),function(i,conv){
				var conversionPart = conv.substr(0,2).toLowerCase();
				var conversionID = conv.substr(2).replace(/[a-zA-Z]{2}\d?$/,"");
				if(Parts_data[conversionPart][conversionID] === undefined) throw "Conversion part target not found ID:" + conversionPart + conversionID;
			});
		});
	}
}

function loadLocalStorageConfig(){
	const localStorageSavedConfigStr = localStorage.getItem(LOCALSTORAGE_CONFIG_KEY);
	const savedVersion = localStorage.getItem(LOCALSTORAGE_VERSION_KEY);
	if (localStorageSavedConfigStr !== null) {
		if (savedVersion !== VERSION) {
			return;
			// TODO: migrate between versions
		}
		let savedConfig = {};
		try {
			savedConfig = JSON.parse(LZString.decompressFromUTF16(localStorageSavedConfigStr));
			if (savedConfig === null) {
				throw "Decompression error"
			}
		} catch (error) {
			Message.set("Unable to load saved configurations. Your localStorage may be corrupted.");
			console.error(error);
			return;
		}

		if (savedConfig) {
			Parts_data_overrides_str = savedConfig.partsDataOverridesStr;
		}
	}
}

function saveLocalStorageConfig(){
	const savingConfig = {
		partsDataOverridesStr: Parts_data_overrides_str
	};
	localStorage.setItem(LOCALSTORAGE_VERSION_KEY, VERSION);
	localStorage.setItem(LOCALSTORAGE_CONFIG_KEY, LZString.compressToUTF16(JSON.stringify(savingConfig)));
}

loadLocalStorageConfig();

/* パーツデータ読込:Start */
var cmn_stat = {}, pd, td, prefixID;
var part_func = function(i, part){
	if(!i) cmn_stat = {}, prefixID = "";
	if (part.indexOf("bd") >
		0) part = "bd";
	if (part.indexOf("wp") >
		0) part = "wp";
	if(this.group || this.commonStat){
		prefixID = this.prefixID || "";
		cmn_stat = $.extend({}, this.commonStat || {});
		var c = 'group';
		if(cmn_stat.type) c += ' '+typeToClass(cmn_stat.type);
		if(cmn_stat.size) c += ' '+sizeToClass(cmn_stat.size);
		if(this.group) $('<li class="'+c+'"></li>').text(this.group).appendTo(List_elms[part]);
		return;
	}

	if(this.id === undefined) throw "ID not found @638";
	this.id = prefixID + this.id;
	if(Parts_data[part][this.id]) throw "Duplicate ID @640";
	Parts_data_base[part][this.id] = {str: JSON.stringify(this), cmn_stat: cmn_stat};
	let partDataOverride;
	if (Parts_data_overrides_str[part][this.id]) {
		try {
			partDataOverride = JSON.parse(Parts_data_overrides_str[part][this.id]);
		} catch (error) {
			Message.set("Failed to parse override data of " + part + " " + this.id + " (" + (this.name || "unknown") + ")");
		}
	}
	if (partDataOverride) {
		pd = Parts_data[part][this.id] = setDefault(partDataOverride, part, cmn_stat);
	} else {
		pd = Parts_data[part][this.id] = setDefault(this, part, cmn_stat);
	}

	if(part!="fixed"){
		if(Parts_data[pd.name]) throw "Duplicate name @644";
		Parts_data[pd.name] = this.id;
		var cls = msToClass(pd);
		if(this.conversion){
		// 	Conversions.push(this.conversion);
			cls+=" conversion " + this.conversion;
		}
		//conversion syntax: a string containing target parent part IDs separated with spaces
		//AMM176 = Wizamel AM ; type:group:id
		//*for fixed parts: add an extra ID to the specific target parent part using BD ID + parttype
		//BDAS67LG = Amlim LG ; fixed in Amlim BD
		if(this.id == "SL16") //The infamous "Dummy part" shield
			cls+=" hidden";
		else if(part!="bd") cls += " "+typeToClass(pd.type)+" "+sizeToClass(pd.size)+(pd.jointPart ? " joint" : "");
		$('<li value="'+i+'" class="prtlst '+cls+'"></li>').text(pd.name).appendTo(List_elms[part])
			.each(function(){
				this.ccd = {part: part, parts_ref: pd};
			}).mouseenter(function(){
				renewPdv(this, this.ccd.parts_ref, Prop.target.ccd.parts_ref);
			});
	}else{
		if(Parts_data.fixed[pd.name]) throw "Duplicate name @655";
		Parts_data.fixed[pd.name] = pd;
	}
}, task = [];

$.each("fixed,bd,wb,lg,hd,bs,am,cwp,mainwp,subwp,hdac,fcac".split(","), function(dummy, part){
	task.push({file:part, callback:part_func});
});
ajaxManager.set(task);
// checkConversions();

/* チューンアップデータ読込:Start */
ajaxManager.set({
	file: TUNEUP_FILE_NAME,
	callback: function(i){
		if(this.group || this.commonStat){
			prefixID = this.prefixID || "";
			cmn_stat = $.extend({}, this.commonStat || {});
			if(this.group) $('<li class="group'+(cmn_stat.target ? ' '+cmn_stat.target : '')+'"></li>').text(this.group).appendTo(List_elms.tune);
			return;
		}

		if(this.id === undefined) throw "ID not found @676";
		if(typeof this.name != "string" || this.name == "") throw "Name error @677";

		td = $.extend(true, {}, cmn_stat, this);

		td.id = prefixID + td.id;

		if(td.type){
			var typ = td.type.match(/[l陸]/) ? "陸" : "－";
			typ += td.type.match(/[a空]/) ? "空" : "－";
			typ += td.type.match(/[c砲]/) ? "砲" : "－";
			typ += td.type.match(/[s補]/) ? "補" : "－";
			if(typ == "－－－－") throw "Type error @688";
			td.type = typ;
		}else td.type = "";
		if(td.size && !td.size.match(/^(SS|S|M|LL|L|-)$/)) throw "Size error @691";

		$.each("cost,capa,hp,str,tec,wlk,fly,tgh".split(","), function(j, s){
			if(td[s] && isNaN(td[s])) throw s.toUpperCase()+" undefined @694";
		});

		if(typeof td.target != "string" ||
			td.target == "" ||
			!td.target.match(/^(cpt|mwp|pwp|ex)( (lg|hd|bs|am|wp|hdac|fcac|mwp|pwp))*$/)) throw "Target error @699";

		if(td.effect){
			for(var s in td.effect){
				if(isNaN(td.effect[s])) throw s + "error @703";
				else td.effect[s] -= 0;
			}
		}

		var material = [];
		(td.material+"").replace(/\|?(\d{1,2})\*(\d+)/g, function(str, id, num){
			material[id] = num-0;
		});
		td.material = material;

		if(td.comment){
			if(typeof td.comment=="string") td.comment = [td.name+' : '+td.comment];
			else if(td.comment.constructor==Array){
				for(var n in td.comment) td.comment[n] += "";
				td.comment[0] = td.name+' : '+td.comment[0];
			}else delete td.comment;
		}

		Master.tuneup[td.id] = td;
		Master.tuneup[td.name] = td.id;
		$('<li value="'+i+'" class="tune_li '+td.target+'"></li>').text(td.name).appendTo(List_elms.tune)
			.each(function(){
				this.ccd = {tune_ref: td};
			}).mouseenter(function(){
				renewPdv(this, this.ccd.tune_ref, Prop.target.ccd.tune_ref);
			});
	}
});/* チューンアップデータ読込:End */

/* データ読込み開始（コールバック） */
ajaxManager.exec(function(){
	$("#OVERLAY").hide();

	$(".ndc_li").toggle(function(){
		$(this).addClass("selected");
		Narrow_down.set("c"+this.value, 1);
	},function(){
		var v = "c"+this.value;
		$(this).removeClass("selected");
		$.each(Narrow_down.expr, function(i){
			if(this == v){
				Narrow_down.expr.splice(i, 1);
				Narrow_down.pointer = Narrow_down.expr.length-1;
				$(Prop.target).val(Narrow_down.expr.join(" ")).trigger("keyup");
			}
		});
	});

	$(List_elms.tune).click(function(e){
		if($(e.target).hasClass("tune_li")){
			UnRedo(Prop.target.ccd_sb);
			Prop.target.ccd.tune_ref = e.target.ccd.tune_ref;
			$(Prop.target).setClass("slot tune"+Prop.target.ccd.tune_ref.target);
			$(Prop.target.parentNode).partCalc();
			calc();
			renewRes();
			Prop.changed = true;
		}
	});
	
	//App finished loading completely here
	qsLoad();
});

function qsLoad()
{
	var querystring = location.search.substring(1);
	if (querystring.length > 0)
	{
		$("#TIO_TEXTAREA").val(querystring);
		$("#TIO_READ").trigger('click');
	}
}

/* ロボ名 */
$("#RENAME_INPUT").keyup(function(){
	var count = 0;
	this.value = escape(this.value).replace(/%u?[0-9A-F]{2,4}|./g, function(c){
		count += c.length > 3 ? 2 : 1;
		if(count>20) return "";
		else return unescape(c);
	});
}).keydown(function(e){
	if(e.keyCode == 13) $("#RENAME_CHANGE").trigger("click");
});
$("#RENAME_CONTAINER").parent().click(function(){return false;});
$("#CHANGE_ROBO_NAME").click(function(){
	$("#RENAME_CONTAINER").parent().show();
	$("#RENAME_INPUT").val(Assembly.robo_name.text);
});
$("#RENAME_CHANGE").click(function(){
	Assembly.robo_name.text = $("#RENAME_INPUT").val();
	$(Assembly.robo_name.elm).text(Assembly.robo_name.text);
	$("#RENAME_CONTAINER").parent().hide();
});
$("#RENAME_CANCEL").click(function(){
	$("#RENAME_CONTAINER").parent().hide();
});

/* ダメージマップ全体表示 */
$(".damage_map").toggle(function(){
	this.showTR = $("tr:visible",this);
	$(this).addClass("all_view").find("tr").show();
	return false;
}, function(){
	$(this).removeClass("all_view").find("tr").not(this.showTR).hide();
	return false;
});

/* UNDO */
$("#UNDO").click(function(){
	if(!$(this).is(".disabled")) UnRedo.exec(1);
	return false;
});
/* REDO */
$("#REDO").click(function(){
	if(!$(this).is(".disabled")) UnRedo.exec();
	return false;
});

/* パーツ解除 */
$("#UNSET_PARTS").mouseenter(function(){
	renewPdv(this, Parts_none, Prop.target.ccd.tuned);
}).click(function(){
	if($(Prop.target).hasClass("slot")){
		UnRedo(Prop.target);
		$(Prop.target).clearTuneData();
		$(Prop.target.parentNode).partCalc();
	}else{
		UnRedo(Prop.target, 1);
		$(Prop.target.parentNode).clearPartData();
		lineCalc();
		if(Prop.target.ccd.part == "wb") Prop.target.value = Assembly.wb.def;
		if(Prop.target.ccd.part == "bd"){
			Assembly.cartridge = {hpup:0};
			$("#CTRG_LIST_CONTAINER").empty();
			$("#CURRENT_LV").text(ADDLEVEL+"/"+MAXLEVEL);
			Result.lv = ADDLEVEL;
			Selected_cartridge = [];
			Prop.changed = false;
		}
	}
	calc();
	renewRes();
});

/* 絞込み機能 */
$.extend(Narrow_down, {
	title: $("#ND_TITLE")[0],
	body: $("#ND_BODY")[0],
	init: function(){
		$("#ND_CARTRIDGE_COL").css("visibility", Prop.target.ccd.part == "bd" ? "" : "collapse");
		$("#NARROW_DOWN_CONTAINER")[Prop.target.ccd.part == "bd" ? "removeClass" : "addClass"]("nbd");
		$("#ND_MINUS").show().removeClass("on");
		$(".ndc_li.selected").removeClass("selected");
		$(".nd_vals,#ND_OPERAND,#ND_AND").hide();
		$("#ND_KEYS").show();
		Narrow_down.pointer = 0;
		Narrow_down.expr = [];
		Prop.target.value = "";
		restrictCheck(Prop.target);
	},
	set: function(val, add){
		if(add){
			Narrow_down.expr.push(val);
			Narrow_down.pointer = Narrow_down.expr.length-1;
		}else if(!Narrow_down.expr[Narrow_down.pointer]){
			Narrow_down.expr[Narrow_down.pointer] = val;
		}else Narrow_down.expr[Narrow_down.pointer] += val;
		$(Prop.target).val(Narrow_down.expr.join(" ")).trigger("keyup");
	},
	unset: function(){
		if(Narrow_down.expr.length){
			if(Narrow_down.expr[Narrow_down.pointer] == "&") Narrow_down.expr.pop();
			for(var i=0; i<3; i++) Narrow_down.expr.pop();
			Narrow_down.pointer = Narrow_down.expr.length-1;
			$(Prop.target).val(Narrow_down.expr.join(" ")).trigger("keyup");
			$(".nd_vals,#ND_OPERAND,#ND_AND").hide();
			$("#ND_KEYS").show();
		}
	}
});
$(".nd_button").each(function(){
	this.ccd = {val: $(this).attr("value")};
});
$("#NARROW_DOWN_CONTAINER").click(function(){
	return false;
});
$("#ND_TITLE").toggle(function(){
	$(this).addClass("opened");
	$(Narrow_down.body).show();
	Narrow_down.init();
},function(){
	$(this).removeClass("opened");
	$(Narrow_down.body).hide();
	Prop.target.value = Prop.target.ccd.parts_ref.name;
});
$(".nd_button.toggle").click(function(){
	$(this).addClass("on").siblings(".toggle").removeClass("on");
	return false;
});
$("#ND_KEYS .nd_button").click(function(){
	if($(this).is(".toggle")){
		Narrow_down.ms = this.ccd.val;
		return false;
	}
	var key = this.ccd.val, operand="", val="";
	$("#ND_KEYS").hide();
	switch(key){
	case "type":
		$("#ND_TYPE,#ND_AND").show();
		$("#ND_OPERAND").hide();
		operand = "=";
		val = Narrow_down.type;
		break;
	case "size":
		$("#ND_SIZE,#ND_OPERAND,#ND_AND").show();
		operand = Narrow_down.operand;
		val = Narrow_down.size;
		break;
	case "pwr":
	case "shl":
	case "rng":
	case "spd":
	case "itv":
		key = Narrow_down.ms + key;
	default:
		$(".nd_numlic,#ND_OPERAND").show();
		operand = Narrow_down.operand;
		break;
	}
	Narrow_down.set(key, 1);
	Narrow_down.set(operand, 1);
	Narrow_down.set(val, 1);
});
$("#ND_OPERAND>.nd_button").click(function(){
	Narrow_down.operand = [">=","<=",">","<","=","!="][this.ccd.val];
	Narrow_down.expr[Narrow_down.pointer-1] = Narrow_down.operand;
	$(Prop.target).val(Narrow_down.expr.join(" ")).trigger("keyup");
});
$("#ND_MINUS").click(function(){
	$(this).toggleClass("on");
});
$(".nd_numlic>.nd_button").click(function(){
	switch(this.ccd.val){
	case "-":break;
	case "@":
		$("#ND_AND").show();
		$(".nd_numlic").hide();
		Narrow_down.set(this.ccd.val);
		break;
	default:
		$("#ND_AND").show();
		if(Narrow_down.expr[Narrow_down.pointer] == ""){
			if(this.ccd.val=="0") $(".nd_numlic").hide();
			else{
				$("#ND_MINUS,#ND_CURRENT_VAL").hide();
				if($("#ND_MINUS").hasClass("on")) Narrow_down.set("-");
			}
		}
		Narrow_down.set(this.ccd.val);
		break;
	}
});
$("#ND_TYPE,#ND_SIZE").children(".nd_button").click(function(){
	switch(this.ccd.val){
	case "l":
	case "a":
	case "c":
	case "s":
		Narrow_down.type = this.ccd.val;
		break;
	default:
		Narrow_down.size = this.ccd.val;
		break;
	}
	Narrow_down.expr[Narrow_down.pointer] = "";
	Narrow_down.set(this.ccd.val);
});
$("#ND_AND>.nd_button").click(function(){
	$(".nd_vals,#ND_OPERAND,#ND_AND").hide();
	$("#ND_KEYS").show();
	Narrow_down.set("&", 1);
});
$("#ND_PREV").click(Narrow_down.unset);
$("#ND_ALLCLEAR").click(Narrow_down.init);

/* リストコンテナ */
$(List_elms.container).each(function(){
	var self = this, timer = 0;
	this.clearTimer = function(){clearTimeout(timer);};
	this.setTimer = function(time){
		if(timer) this.clearTimer();
		var ccd = Prop.target.ccd;
		timer = setTimeout(function(){
			$(self).hide();
			if(ccd.parts_ref)
				Prop.target.value = (ccd.part == "wb" && ccd.parts_ref == Parts_none) ? Assembly.wb.def : ccd.parts_ref.name;
		}, time);
	};
}).mouseenter(function(){
	this.clearTimer();
}).mouseleave(function(){
	this.setTimer(500);
}).click(function(e){
	$(this).hide();
	this.clearTimer();
	return false;
});

/* BDパーツリスト */
$(List_elms.bd).click(function(e){
	
	if(e.target.ccd == undefined) return false;
	
	if(e.target.ccd.parts_ref.maxlevel == undefined){
		MAXLEVEL = MAXLEVEL_DEF;
		ADDLEVEL = ADDLEVEL_DEF;
		}
	else{
		MAXLEVEL = e.target.ccd.parts_ref.maxlevel;
		ADDLEVEL = e.target.ccd.parts_ref.addlevel;
		}
	
	if(e.target.ccd.parts_ref.incomplete == 1){
		alert("This robot is marked incomplete, something may be wrong with its stats, cart levels, parts or anything else. Please contact me if you're interested in providing the data.");
	}
	
	var ccd = Prop.target.ccd, pd = e.target.ccd.parts_ref, def_wb = Master.defaultwb[pd.wbid]+"(default)", class_str = "select_box"+msToClass(pd);

	if(ccd.parts_ref == pd) return;
	if(!Assembly.robo_name.text){
		Assembly.robo_name.text = pd.name.split("BD")[0];
		$(Assembly.robo_name.elm).text(Assembly.robo_name.text);
	}
	$("#EXEC_AURA_SYSTEM")[pd.auraSystem ? "show" : "hide"]().removeClass("active");

	Assembly.wb.def = def_wb;
	Assembly.wb.sb.value = def_wb;
	Assembly.cartridge = pd.cartridge;
	makeCartridgeLst();
	$("#ASSEMBLE .branch>.select_box:visible").each(function(){
		var current_pd = this.ccd.parts_ref;
		if(current_pd != Parts_none){
			if(current_pd.type.indexOf(pd.type) < 0 ||
				Math.abs(SIZE_TO_NUMLIC[current_pd.size] - SIZE_TO_NUMLIC[pd.size]) > 1){
				$(this.parentNode).clearPartData();
			}
		}
	});

	UnRedo(Prop.target);
	setPartsData(Prop.target, {ref:pd});

	calc();
	renewRes();
	Prop.changed = true;
});

/* BDパーツ以外リスト */
$(".parts_list:not('#LIST_BD')").click(function(e){
	if(e.target.ccd == undefined) return false;
	var ccd = Prop.target.ccd, pd = e.target.ccd.parts_ref, class_str = "select_box", parts_stack = [];

	if(ccd.parts_ref == pd) return false;

	if(ccd.part=="wb") class_str += " bltin_wb";
	class_str += msToClass(pd);
	if(pd.jointPart) class_str += " joint";

	parts_stack.push({ref:pd});

	if(pd.jointPart){
		if(ccd.parts_ref != Parts_none && ccd.parts_ref != pd && !ccd.parts_ref.jointPart){
			if(confirm("You're adding "+pd.name+" joint.")){
				$(Prop.target.parentNode).find(".select_box:visible").each(function(i){
					var slot = [];
					$(this.ccd.slot).each(function(){
						slot.push(this.ccd.tune_ref);
					}).clearTuneData();
					if(!$(this).is(".fixed")) parts_stack.push({ref:this.ccd.parts_ref, slt:slot});
				});
			}
		}
	}

	UnRedo(Prop.target, 1);
	setPartsData(Prop.target, parts_stack);

	calc();
	renewRes();
	Prop.changed = true;
});

$("#EXEC_AURA_SYSTEM").click(function(){
	$(this).toggleClass("active");
	calc();
	renewRes();
});

$("#ASSEMBLE_CONTAINER").click(function(){
	$(List_elms.container).hide();
});

/* パーツ選択欄 */
$(".select_box").each(function(){
	this.value = "-";
	this.ccd = {
		parts_ref: Parts_none,
		tuned: Parts_none,
		slot: []
	};
	this.parentNode.ccd_sb = this;
	if($(this.parentNode).hasClass("part_bd")){
		this.ccd.part = "bd";
		this.ccd.list = $("#LIST_BD")[0];
	}else{
		this.ccd.part = "wb";
		this.ccd.list = $("#LIST_WB")[0];
	}
}).mouseenter(function(){
	renewPdv(this, this.ccd.tuned);
}).blur(function(){
	if(!$(this).hasClass("fixed")) this.value = this.ccd.parts_ref.name;
}).click(function(){
	if($(this).hasClass("fixed")) return;

	var prt = this.ccd.part.toUpperCase(), selected = $(this.ccd.list).children(":contains('"+this.value+"'):eq(0)");
	restrictCheck(this);

	this.select();

	if(this.ccd.parts_ref == Parts_none) $(this.ccd.list).children(".selected").removeClass("selected");
	else selected.addClass("selected").siblings(".selected").removeClass("selected");

	$(".parts_list, #LIST_TUNE").hide();
	
	$(List_elms.container).css({
		left: $(this).position().left,
		top: $(this).position().top+$(this).outerHeight(),
		display: "block"
	});

	$(this.ccd.list).find(".group").show();
	$(this.ccd.list).show().scrollTop($(this.ccd.list).scrollTop()-Settings.scroll_offset+(selected.position()||{}).top);

	Prop.target = this;
	$("#NARROW_DOWN_CONTAINER").show();
	if($(Narrow_down.body).is(":visible")) Narrow_down.init();

	return false;
}).keyup(function(ev){

	//$(this).val(capitalize($(this).val()));
	
	if($(this).hasClass("fixed")) return;

	var prt = this.ccd.part.toUpperCase(), val = this.value;
	
	$(this.ccd.list).find(".group").show();
	
	if(this.value.search(/(type|size|cost|capa|hp|str|tec|wlk|fly|tgh|pwr|shl|rng|spd|itv) *([<>!]?={1,2}) |c([0-9]{1,2})/)>-1){
		var trg = [], exp = [], i = 0, slfdat = this.ccd.parts_ref;
		val.toLowerCase().replace(/type *= *([lacs])/g, function(str, v){
			v = {l:"陸",a:"空",c:"砲",s:"補"}[v];
			exp.push("e["+(i++)+"].indexOf('"+v+"')>=0");
			trg.push({t:"type"});
		}).replace(/size *([<>=!]=?) *(@|ss|s|m|l|ll)/g, function(str, o, v){
			o = o=="=" ? "==" : o;
			if(v=="@") v = slfdat.size || Result.size || "m";
			exp.push("SIZE_TO_NUMLIC[e["+(i++)+"]]"+o+SIZE_TO_NUMLIC[v.toUpperCase()]);
			trg.push({t:"size"});
		}).replace(/(cost|capa|hp|str|tec|wlk|fly|tgh) *([<>=!]=?) *(0|-?[1-9][0-9]{0,4}|@)/g, function(str, t, o, v){
			o = o=="=" ? "==" : o;
			if(v == "@") v = slfdat[t] || 0;
			exp.push("e["+(i++)+"]"+o+v);
			trg.push({t:t});
		}).replace(/(s?)(pwr|shl|rng|spd|itv) *([<>=!]=?) *(0|-?[1-9][0-9]{0,4}|@)/g, function(str, ms, t, o, v){
			ms = {m:"main",s:"sub"}[ms] || "main";
			if(v == "@") v = slfdat[ms] && slfdat[ms][t] || 0;
			exp.push("e["+(i++)+"]"+o+v);
			trg.push({t:t,ms:ms});
		}).replace(/c([0-9]{1,2})/g, function(str, v){
			exp.push("e["+(i++)+"]["+v+"]");
			trg.push({t:"ctrg", v:v});
		});

		if(trg.length){
			exp = exp.join(" && ");
			restrictCheck(this);
			$(this.ccd.list).show().children(".prtlst:visible").each(function(){
				var pd = this.ccd.parts_ref, e = [];
				for(var i=0; i<trg.length; i++){
					var t = trg[i];
					switch(trg[i].t){
					case "type":
					case "size":
					case "conversion":
						e.push(pd[trg[i].t] || "");
						break;
					case "maxlevel":
					case "addlevel":
					case "incomplete":
					case "cost":
					case "capa":
					case "hp":
					case "str":
					case "tec":
					case "wlk":
					case "fly":
					case "tgh":
						e.push(pd[trg[i].t] || 0);
						break;
					case "ctrg":
						e.push(pd.cartridge || []);
						break;
					case "pwr":
					case "shl":
					case "rng":
					case "spd":
					case "itv":
					default:
						if(pd[t.ms]) e.push(pd[t.ms][t.t][0] || 0);
						else{
							$(this).hide();
							return;
						}
						break;
					}
				}
				if(!eval(exp)) $(this).hide();
			});
		}

	}else if(this.value == ""){
		restrictCheck(this);
	//if(val[0] < "a" || val.charCodeAt(0) > 256){
	}else{
		restrictCheck(this);

		$(this.ccd.list).show().children(".prtlst:visible").each(function(){
			if($(this).text().toUpperCase() == val.toUpperCase() || $(this).text().toUpperCase() == (val+prt).toUpperCase()) $(this).trigger("click");
			else if($(this).text().toUpperCase().indexOf(val.toUpperCase())!=0) $(this).hide();
		});
	}
	//clear empty group header from list
	$(this.ccd.list).find(".group").each(function(){
		if( $(this).nextAll(":visible").first().is(".group") || $(this).nextAll(":visible").length === 0 )
			$(this).css("display","none");
	});
}).keydown(function(ev){
	//henkan was here
});

/* LEVEL DOWN ボタン */
$("#LV_DOWN_BTN").click(function(){
	if(Selected_cartridge.length){
		$(Selected_cartridge.pop()).removeClass("selected");
		Result.lv--;
		$("#CURRENT_LV").text(Result.lv+"/"+MAXLEVEL);
		calc();
		renewRes();
		Prop.changed = true;
	}
});

/* スロット */
$(".slot").each(function(){
	this.value = 0;
	this.ccd_sb = $(this).siblings(".select_box")[0];
	this.ccd = {tune_ref: Parts_none};
}).mouseenter(function(){
	renewPdv(this, this.ccd.tune_ref);
}).click(function(){
	var pos = $(this).position();
	pos.left += Settings.left_offset;

	$(".parts_list").hide();
	$(List_elms.container).css(pos).add(List_elms.tune).show();
	Prop.target = this;

	// チューンの部位制限を正確に反映
	var pd = this.ccd_sb.ccd.parts_ref;
	$(".cpt").filter(".hd,.bs,.lg,.am").hide();
	$(".ex").filter(".hd,.bs,.lg,.am").hide();
	if(!pd.jointPart) $(".cpt."+this.ccd_sb.ccd.part).show();
	if(!pd.jointPart) $(".ex."+this.ccd_sb.ccd.part).show();
	$(".mwp")[pd.tunable && pd.tunable.mwp ? "show" : "hide"]();
	$(".pwp")[pd.tunable && pd.tunable.pwp ? "show" : "hide"]();

	$("#NARROW_DOWN_CONTAINER").hide();
	return false;
});

/* テキスト入出力 */
$("#TEXT_IO_CONTAINER").click(function(){return false;})
	.parent().click(function(){$(this).hide();});
$("#TIO_CLOSE").click(function(){$("#TEXT_IO_CONTAINER").parent().hide();});
$("#TIO_TEXTAREA").dblclick(function(){this.select();});

$("#COMP_OUT_CONTAINER").click(function(){return false;})
	.parent().click(function(){$(this).hide();});
$("#COMP_OUT_CLOSE").click(function(){$("#COMP_OUT_CONTAINER").parent().hide();});
$("#COMP_OUT_TEXTAREA_1").dblclick(function(){this.select();});
$("#COMP_OUT_TEXTAREA_2").dblclick(function(){this.select();});

/* テキスト出力 */
$("#TIO_OUT").click(function(){

	var str = "[Robot Name]\n"+Assembly.robo_name.text+"\n\n[Parts]\nBD： "+Assembly.bd.sb.value+"\n",
		material = [];

	outBranch(Assembly.bd.elm, 1);

	str += "\n[Config Check]\n";
	str += "COST: "+(Result.capa < Result.cost ? "OVERCOST" : "OK")+"\n";

	$.each(["BS","LG"], function(i, p){
		str += p+": "+(Result[p.toLowerCase()] ? "OK" : "NOT PRESENT")+"\n";
	});
	
	str += "AURA: "+($("#EXEC_AURA_SYSTEM").hasClass("active") ? "ON" : "OFF")+"\n";

	str += "\n[Stats]\n";
	$.each("TYPE,SIZE,COST,CAPA,HP,STR,TEC,WLK,FLY,TGH".split(","), function(i, p){
		str += p+": "+Result[p.toLowerCase()]+"\n";
	});

	str += "\nLEVEL: "+Result.lv+"\n";
	if(Result.lv>0){
		str += "\n[Cartridges]\n";
		str += countCartridge(true).join("\n");
		str += "\n";
	}

	if(material.length){
		str += "\n[Material]\n";
		for(var k in material) str += Master.material[k]+"×"+material[k]+"\n";
	}

	$("#TEXT_IO_CONTAINER").parent().show();
	$("#TIO_TOP").text("Text output");
	$("#TIO_BOTTOM").addClass("tout");
	var elm = $("#TIO_TEXTAREA").addClass("read_only").val(str)[0];
	elm.focus();
	elm.select();
	elm.readOnly = true;
	Prop.changed = false;

	function outBranch(elm, l){
		$(elm).children(".branch").each(function(){
			if($(this).is(":visible")){
				for(var i=0;i<l;i++) str += "　";
				str += $(this).children("img").attr("title")+": "+this.ccd_sb.value;
				$.each(this.ccd_sb.ccd.slot, function(){
					if(this.ccd.tune_ref != Parts_none){
						str += " ["+this.ccd.tune_ref.name+"]";
						for(var k in this.ccd.tune_ref.material){
							if(!material[k]) material[k] = 0;
							material[k] += this.ccd.tune_ref.material[k];
						}
					}
				});
				str+="\n";
				if($(this).children(".branch").length) outBranch(this, l+1);
			}
		});
	}
});

/* 圧縮形式 */
$("#TIO_COMP_OUT").click(function(){
	$("#COMP_OUT_CONTAINER").parent().show();
	var data = escape(compOut());
	//$.ajax({url:"loaddata.php",global: false,type: "POST",timeout: 9000,data: ({d: data, a: "1"}),dataType: "html",async:false});
	var elm = $("#COMP_OUT_TEXTAREA_2").addClass("read_only").val(data+'\n')[0];
	elm.readOnly = true;
	var elm = $("#COMP_OUT_TEXTAREA_1").addClass("read_only").val(compress(data)+'\n')[0];
	elm.readOnly = true;
	elm.focus();
	//elm.select();
});

$("#URL_TOGGLE_1").click(function(){
	var elm = $("#COMP_OUT_TEXTAREA_1")[0];
	elm.value = elm.value.indexOf(CODEW_URL+'?')>=0 ? elm.value.replace(CODEW_URL+'?',"") : CODEW_URL+'?' + elm.value;
});

$("#URL_TOGGLE_2").click(function(){
	var elm = $("#COMP_OUT_TEXTAREA_2")[0];
	elm.value = elm.value.indexOf(CODEW_URL+'?')>=0 ? elm.value.replace(CODEW_URL+'?',"") : CODEW_URL+'?' + elm.value;
});

/* テキスト入力 */
$("#TIO_IN").click(function(){
	$("#TEXT_IO_CONTAINER").parent().show();
	$("#TIO_TOP").text("Enter the code string");
	$("#TIO_BOTTOM").removeClass("tout");
	$("#TIO_TEXTAREA").removeClass("read_only")[0].readOnly = false;
});

$("#TIO_CLEAR").click(function(){
	$("#TIO_TEXTAREA")[0].value = "";
});

$("#TIO_READ").click(function(){
	if(Prop.changed){
		if(!confirm("You're about to overwrite your current data.\nAre you sure?")) return false;
		Prop.changed = false;
	}
	
	var str = $("#TIO_TEXTAREA")[0].value,
		part_id = str.indexOf("[Parts]"),
		config_id = str.indexOf("[Config Check]"),
		//parts = str.match(/\[Parts\][^\[]+/)+"";
		cartridge = (str.match(/\[Cartridges\][^\[]+/)+"").split("\n"),
		ccd = {part:[],cartridge:[]}, i = 0, parts;

	//config_id = config_id>=0 ? config_id : str.length()-1;
	if(part_id<0) parts="null";
	else parts = str.substr(part_id,config_id-part_id-1);

	//$.ajax({url:"loaddata.php",global: false,type: "POST",timeout: 9000,data: ({d: str, a: "2"}),dataType: "html",async:false});
	if(parts!="null"){
		ccd.name = (str.match(/\[Robot Name\][\r\n][^\r\n]+/)+"").split("\n")[1] || "Name Not Found";
		if(ccd.name == "Name Not Found") Message.set("[Robot Name] not found", 1);
		parts.replace(/(BD|WB|LG|HD|BS|AM|WP|HDAC|FCAC)[:：][ 　\t]*([^\r\n]+)/g, function(str, p1, p2){
			if(p1 == "WB" && p2.indexOf("(default)") > 0) return;
			ccd.part[i] = {part: p1.toLowerCase(), slot:[]};
			$.each(p2.split(/[ 　\t]+\[/), function(){
				if(this[this.length-1] == "]"){
					var tn = (this+"").substr(0, this.length-1);
					if(Master.tuneup[tn] == undefined) Message.set(tn+" Tuning data not found", 1);
					else ccd.part[i].slot.push(Master.tuneup[Master.tuneup[tn]]);
				}else{
					ccd.part[i].name = this+"";
				}
			});
			i++;
		});
	
		$.each(cartridge, function(i){
			if(i){
				var str = this.replace(/^[ 　\t]+|[ 　\t\r\n]+$/, "");
				if(str != ""){
					if(Master.cartridge[str.split("×")[0]] != undefined) ccd.cartridge.push(str);
					else Message.set(str+" Cartridge data not found", 1);
				}
			}
		});
	}else{
		str = str.replace(/^\s+|\s+$/g, '');
		if(str) ccd = readCompData(unescape(uncompress(str)));
	}
	
	if(ccd.part.length){
		autoSetup(ccd);
		Message.set("Configuration loaded successfully");
		$(this).parents(".transparent_field").hide();
	}else{
	 Message.set("Failed to load configuration", 1);
	}
	Prop.changed = false;


});


$("#DATA_EDIT_CONTAINER").click(function(){return false;})
	.parent().click(function(){$(this).hide();});
$("#DATA_EDIT_CLOSE").click(function(){$("#DATA_EDIT_CONTAINER").parent().hide();});
$("#DATA_EDIT_BUTTON").click(function(){
	if (!this.partDataRef || !this.partDataRef.ccd || !this.partDataRef.ccd.part || !this.partDataRef.ccd.parts_ref) {
		return;
	}
	const part = this.partDataRef.ccd.part;
	const id = this.partDataRef.ccd.parts_ref.id;
	const name = this.partDataRef.ccd.parts_ref.name;
	if (part && id) {
		$("#DATA_EDIT_APPLY")[0].partDataRef = this.partDataRef;
		$("#DATA_EDIT_RESET")[0].partDataRef = this.partDataRef;
		$("#DATA_EDIT_TOP").text("Editing Data: " + name);
		$("#DATA_EDIT_TEXTAREA").val(Parts_data_overrides_str[part][id] || Parts_data_base[part][id].str);
		$("#DATA_EDIT_CONTAINER").parent().show();
	}
});
$("#DATA_EDIT_RESET").click(function(){
	$("#DATA_EDIT_TEXTAREA").val(Parts_data_base[this.partDataRef.ccd.part][this.partDataRef.ccd.parts_ref.id].str);
});
$("#DATA_EDIT_APPLY").click(function(){
	const part = this.partDataRef.ccd.part;
	const id = this.partDataRef.ccd.parts_ref.id;
	const partDataStr = $("#DATA_EDIT_TEXTAREA")[0].value;

	if (partDataStr === Parts_data_base[part][id].str) {
		delete Parts_data_overrides_str[part][id];
		saveLocalStorageConfig();
	}

	let applyingPartData;
	try {
		applyingPartData = JSON.parse(partDataStr);
	} catch (error) {
		alert(error);
		return;
	}

	if (applyingPartData) {
		if (partDataStr !== Parts_data_base[part][id].str) {
			// TODO: add another button to clear all overrides
			Parts_data_overrides_str[part][id] = partDataStr;
			saveLocalStorageConfig();
		}
		$.extend(Parts_data[part][id], setDefault(applyingPartData, part, Parts_data_base[part][id].cmn_stat));
		autoSetup(readCompData(compOut()));
		if (this.partDataRef.ccd.tuned) {
			renewPdv(this.partDataRef, this.partDataRef.ccd.tuned);
		} else {
			renewPdv(this.partDataRef, Parts_data[part][id])
		}
	}
});

/* クッキー保存 */
$("#SAVE_SLOT").click(function(){
	$("#SS_LIST").toggle();
	$(document.body).one("click", function(){$("#SS_LIST").hide();});
	return false;
});
$("#SS_SAVE").click(function(){
	var save_slot = Settings.save_slot, ck = getStorage(save_slot) != "";

	if(Assembly.bd.sb.ccd.parts_ref == Parts_none){
		if(ck){
			if(confirm("Clear saved data from slot "+save_slot+"?")){
				clearStorage(save_slot);
				$(".ss_item:eq("+save_slot+")").text("slot "+save_slot+": no data");
			}
		}//else alert("パーツ選択後、保存ボタンを押下してください。");
		return false;
	}
	if(ck != "" && !confirm("You're about to overwrite the robot config. Are you sure?")) return false;
	//var data = compress(escape(compOut()));
	//$.ajax({url:"loaddata.php",global: false,type: "POST",timeout: 9000,data: ({d: data, a: "3"}),dataType: "html",async:false} );
	if(setStorage(save_slot, compOut())){
		$("#SS_CURRENT_VAL, .ss_item:eq("+save_slot+")").text("slot "+save_slot+": "+Assembly.robo_name.text);
		Message.set("Configuration saved");
	}else Message.set("Failed to save configuration", 1);
	Prop.changed = false;
});

/* クッキー読み込み */
$("#SS_READ").click(function(){
	if(Prop.changed){
		if(!confirm("Loading this config will overwrite current one.\nAre you sure?")) return false;
		Prop.changed = false;
	}
	//var data = compress(escape(compOut()));
	//$.ajax({url:"loaddata.php",global: false,type: "POST",timeout: 9000,data: ({d: data, a: "4"}),dataType: "html",async:false} );
	var ck = getStorage(Settings.save_slot), ccd;
	if(ck){
		ccd = readCompData(ck);
		autoSetup(ccd);
		Message.set("Configuration loaded successfully");
		Prop.changed = false;
	}
});

/* クッキー削除 */
$("#SS_CLEAR").click(function(){
	if(confirm("Clear saved data from slot "+Settings.save_slot+"?")){
		clearStorage(Settings.save_slot);
		$("#SS_CURRENT_VAL, .ss_item:eq("+Settings.save_slot+")").text("slot "+Settings.save_slot+": no data");
		Message.set("Slot "+Settings.save_slot+" cleared successfully");
	}
});

/* BDパーツ名からのパーツ全選択 */
$("#SET_ALL_PARTS").click(function(){
	var roboname = Assembly.bd.sb.value.split("BD");
	if(roboname[0] == "-") return;
	$("#ASSEMBLE .branch:visible").not(".part_wb,.part_hdac,.part_fcac,.part_wp").each(function(){
		var prt = this.ccd_sb.ccd.part, pd = {}, 
			pname = roboname[0] + prt.toUpperCase(),
			bdpd = Assembly.bd.sb.ccd.parts_ref;
		if($(this.ccd_sb).is(".fixed")) return;
		//if(Parts_data[pname+(roboname[1] || "")] != undefined) pname += roboname[1];
		if(roboname[1]){
			pd = Parts_data[pname+roboname[1]] ? Parts_data[prt][Parts_data[pname+roboname[1]]] : undefined;
			if(pd != undefined && pd.type.indexOf(bdpd.type) > -1 && Math.abs(SIZE_TO_NUMLIC[bdpd.size] - SIZE_TO_NUMLIC[pd.size]) < 2)
				pname += roboname[1];
			else for(var i = roboname[1];i>"1";i--){
					pd = Parts_data[pname+i] ? Parts_data[prt][Parts_data[pname+i]] : undefined;
					if(pd != undefined && pd.type.indexOf(bdpd.type) > -1 && Math.abs(SIZE_TO_NUMLIC[bdpd.size] - SIZE_TO_NUMLIC[pd.size]) < 2){
						pname+=i;
						break;
					}
				}
		}else if(Parts_data[pname] == undefined){
			for(p in Parts_data[prt]){
				pd = Parts_data[prt][p];
				if(pd.type && pd.type.indexOf(bdpd.type) > -1 &&
				 Math.abs(SIZE_TO_NUMLIC[bdpd.size] - SIZE_TO_NUMLIC[pd.size]) < 2){
					if(pname.indexOf(pd.name) > -1 || pd.name.indexOf(pname) > -1){
						pname = pd.name;
						break;
					}
				}
			}
		}
		try{
			pd = Parts_data[prt][Parts_data[pname]];
			if(this.ccd_sb.ccd.parts_ref == pd) return;

			UnRedo(this.ccd_sb);
			setPartsData(this.ccd_sb, {ref:pd});

		}catch(e){}

	});
	calc();
	renewRes();
	Prop.changed = true;
});

/* ダメージマップ作成 */
$.each(["TEC","STR"], function(i, s){
	var str='<tr><th class="th1 sprite"><div class="right">'+s+'</div><div class="left">Force</div></th>',
		coefficient = Settings.coefficient[s.toLowerCase()] / 1000;
	for(var stat=0;stat<=40;stat++){
		str += '<th'+(stat%2?' class="even">':'>')+(stat<10?'&nbsp;':'')+stat+'</th>';
	}
	s = "#"+s+"_DAMAGE_MAP ";
	$(str+"</tr>").appendTo(s+"thead");

	for(var pwr=1;pwr<=INI.mapInitMax;pwr++){
		str = '<tr style="display:none;" pwr="'+pwr+'"><th>'+pwr+'</th>';
		for(var stat=0;stat<=40;stat++){
			var v = parseInt(pwr*(1+coefficient*(stat-10))+0.5);
			str += '<td'+(stat%2?' class="even">':'>')+v+'</td>';
		}
		$(str+"</tr>").appendTo(s+"tbody");
	}
});

loadCookieToStorage();
initCookieRead();

});/* CosmiCalc Init処理:End */

/*************
 * functions *
 *************/
function compress(data){
	var frequency_table, word = "", max_rate, w, i, j, k, l = 0, m, rate, mr_key;
	
	/* ロボ名に圧縮に使用する文字が含まれていた場合は先に外へ出す */
	data = data.replace(RegExp("["+COMPRESS_CHARS+"]+", "g"), function(str){
		word += "|"+str;
		return COMPRESS_CHARS.charAt(l++);
	});

	for(m=0; m<COMPRESS_CHARS.length; m++){
		frequency_table = [];
		for(j=5; j>1; j--){
			for(i=0; i<data.length-j; i++){
				w = data.substr(i, j);
				if(frequency_table[w] == undefined) frequency_table[w] = 1;
				else frequency_table[w]++;
			}
		}
		max_rate = 0;
		for(k in frequency_table){
			rate = (k.length - 1) * (frequency_table[k] - 1) - 2;
			if(rate > max_rate){
				max_rate = rate;
				mr_key = k;
			}
		}
		if(max_rate){
			data = data.replace(RegExp(mr_key, "g"), COMPRESS_CHARS.charAt(l++));
			word += "|"+mr_key;
		}else break;
	}

	return data+word;
};

function uncompress(data){
	var dat = data.split("|"), res = dat.shift(), i;
	for(i=dat.length; i; i--){
		res = res.replace(RegExp(COMPRESS_CHARS.charAt(i-1), "g"), dat.pop());
	}
	return res;
};

function secureJSON(data){
	return data
		.replace(/\/\/[^\n]*/g, '')
		.replace(/[\\<>\r]/g, function(str){return {"\\":"\\\\","<":"＜", ">":"＞", "\r":""}[str];});
};

function evalJSON(data, fname){
	var filtered = data.replace(/\w+\s*:/g, '').replace(/-?\d+|"[^\"\n]*"/g, '').replace(/[\[\],{}\s]+/g, ''),
		errmsg = [], fstr, line = 1, bc = '', b1 = 0, b2 = 0, brackets = [], str = "", errcnt = 0;
	try{
		if(filtered!="") throw "";
		return eval('(['+data.replace(/\}\s*\{/g, '},{')+'])');
	}catch(e){
		function check_str(obj){
			if(!str.match(obj ? /^[a-z]\w+:(?:-?\d+|"[^\"\n]*")$/ : /^(-?\d+|"[^\"\n]*")$/))
				errmsg.push("Unable to resolve '"+str+"' @1620");
		};

		try{
			$.each(data, function(i, c){
				if(i > MAX_DATA_SIZE) throw "Data size too large";
				if(fstr){
					 str += c;
					 if(c=='"') fstr = 0;
				}else{
					switch(c){
					case ' ':
					case '\t':
					case '\r':
						break;
					case '"':
						str += c;
						fstr != fstr;
						bc = c;
						break;
					case '\n':
						if(errmsg.length){
							errmsg.unshift('JSON parsing error:　'+fname+'.json　at line'+line);
							errcnt += errmsg.length-1;
							if(errcnt > MAX_ERROR_COUNT) throw "Unexpected error count @1644";
							Message.set(errmsg, 2);
							errmsg = [];
						}
						line++;
						break;
					case ',':
						if(str) check_str(brackets[brackets.length-1]);
						str = "";
						bc = c;
						break;
					case '{':
						switch(bc){
						case '{':
							errmsg.push('　　"{" count error');	// }}
							b1--;
							break;
						case ',':
						case '[':
						case ':':
							break;
						default:
							if(b1 > 0){
								errmsg.push('　　"}" count error');
								b1 = 0;
							}
							if(b2 > 0){
								errmsg.push('　　"]" count error');
								b2 = 0;
							}
							break;
						}
						brackets.push(1);
						b1++;
						str = "";
						bc = c;
						break;
					case '}':
						if(str) check_str(brackets.pop());
						b1--;
						if(b1 < 0){
							errmsg.push('　　"}" count error');
							b1 = 0;
						}
						str = "";
						bc = c;
						break;
					case '[':
						if(bc != ':') errmsg.push('Unable to resolve "'+(str || bc)+c+'"');
						brackets.push(0);
						b2++;
						str = "";
						bc = c;
						break;
					case ']':
						if(str) check_str(brackets.pop());
						b2--;
						if(b2 < 0){
							errmsg.push('　　"[" count error');
							b2 = 0;
						}
						str = "";
						bc = c;
						break;
					default:
						str += c;
						bc = c;
						break;
					}
				}
			});
		}catch(e){
			Message.set(e, 2);
		}
		return false;
	}
};

var ajaxManager = new function(){
	var i, tasks = [], task, tcount, work;
	this.set = function(task){
		tasks.push(task);
	};
	this.exec = function(callback){
		task = tasks.shift();
		if(task.constructor!==Array) task = [task];
		for(tcount=0,i=0; i<task.length; i++) (function(fname, cb){
			var expandData = function(data){
				if(!data) Message.set('(E)　'+fname+'　failed to load.', 2);
				else if(data = evalJSON(secureJSON(data), fname)){
					Message.set(fname);
					$.each(data, function(i){
						try{
							cb.call(this, i, fname.indexOf("wp")>0 ? "wp" : fname);
						}catch(e){
							Message.set('"'+this.name+'" ['+e+'] '+fname+'('+i+')', 1);
						}
					});
					Message.set("loading successfull");
				}
				if(++tcount == task.length){
					if(tasks.length) ajaxManager.exec(callback);
					else callback();
				}
			};
			$.ajax({
				//here CODEW_URL+fname, +".json" was added to make it work with files instead of php script
				url: (INI.webAccess && INI.accessData[fname] ? CODEW_URL+"data/"+fname+".json" : INI.dataFolder+fname+".json"),
				timeout: INI.timeout,
				dataType: "text",
				success: expandData,
				error: function(){
					if(INI.webAccess && INI.accessData[fname]){
						Message.set(fname+"  - Can't load from web. Using local files instead", 1);
						$.get(INI.dataFolder+fname+".json", expandData);
					}else Message.set(fname+" is missing", 2);
				}
			});
		})(task[i].file, task[i].callback);
	};
};

function getStorage(key, comp){
	if(localStorage[key]==null) return "";
	else return comp ? localStorage[key] : unescape(uncompress(localStorage[key]));
};

function setStorage(key, val, tmp, ck) {
	ck = getStorage(key, 1);
	//tmp = compress(escape(val));
	tmp = escape(val);
	localStorage[key]=tmp;
	return getStorage(key, 1) == tmp;
};

function clearStorage(key) {
	localStorage.removeItem(key);
};

String.prototype.capitalize = function(){
   return this.replace( /(^|\s)([a-z])/g , function(m,p1,p2){ return p1+p2.toUpperCase(); } );
  };

function compOut(){
	var compdata = Assembly.robo_name.text.toUpperCase()+'&', i=0, part = [], slot;
	
	$("#ASSEMBLE .select_box:visible").each(function(){
		if(this.ccd.parts_ref == Parts_none && this.ccd.part.toUpperCase() != "WP") return;
		
		part[i] = this.ccd.part.toUpperCase()+':'+ (Parts_data[this.value] || "-");
		slot = [];
		$.each(this.ccd.slot, function(){
			if(this.ccd.tune_ref != Parts_none) slot.push(Master.tuneup[this.ccd.tune_ref.name]);
		});
		if(slot.length) part[i] += '@'+slot.join(',');
		i++;
	});
	compdata += part.join('|');
	compdata += '#'+countCartridge().join(',');
	return compdata;
};

function readCompData(str){
	var ccd={}, tmp = str.split("&"), pdat;
	ccd.name = tmp[0].toLowerCase().capitalize();
	str = tmp[1];
	tmp = str.split("#");
	ccd.cartridge = tmp[1] || "";
	if(ccd.cartridge == "") ccd.cartridge = [];
	else ccd.cartridge = ccd.cartridge.split(",");
	str = tmp[0];
	ccd.part = str.split("|");
	for(var i in ccd.part){
		var cp = ccd.part[i];
		ccd.part[i] = {};
		ccd.part[i].part = (tmp = cp.split(":"))[0].toLowerCase();
		pdat = Parts_data[ccd.part[i].part];
		cp = tmp[1];
		tmp = cp.split("@");
		ccd.part[i].name = pdat[tmp[0]] && pdat[tmp[0]].name || '';
		if(ccd.part[i].name.indexOf("default")>0) ccd.part[i].name = "-";
		cp = tmp[1] || "";
		ccd.part[i].slot = cp.split(",");
	}
	return ccd;
};

function countCartridge(t){
	var c = [], cc = [];
	$(".cartridge").each(function(){
		if($(this).hasClass("selected")) c.push(this.ccd.cid);
	});
	if(c.length){
		$.map(c, function(n){
			if(isNaN(cc[n])) cc[n]=1;
			else cc[n]++;
		});
		c = [];
		for(var n in cc){
			c.push(
				cc[n]>1 ?
				(t ? Master.cartridge[n].name+"×" : n+"*")+cc[n] :
				(t ? Master.cartridge[n].name : n)
			);
		}
	}
	return c;
};

function typeToClass(typ){
	var cls = [];
	typ.replace(/[陸空砲補]/g, function(str){
		cls.push({"陸":"riku", "空":"ku", "砲":"hou", "補":"ho"}[str]);
	});
	return cls.join(" ");
};

function sizeToClass(siz){
	var cls = [];
	siz.replace(/SS|S|M|LL|L/g, function(str){
		cls.push("siz_"+str.toLowerCase());
	});
	return cls.join(" ");
};

function msToClass(pd){
	var ms = (pd.main ? "m" : "")+(pd.sub ? "s" : "");
	return ms ? " bltin_"+ms : "";
};

function capitalize(str){
	return str[0].toUpperCase()+str.substr(1);
};

function kanaHenkan(str){
	return str.replace(/ny?[aiueo]?|[qwrtypsdfghjklzxvbnm]*[aiueon-]/g, function(s){
		var xt = "";
		if(s[0]==s[1]){
			s = s.substr(1);
			xt = "ッ";
		}
		return INI.henkan[s] ? xt+INI.henkan[s] : s;
	});
};

function lineCalc(){
	$(".branch_line").each(function(){
		var ppos = $(this.parentNode.parentNode).position(), pos = $(this.parentNode).position();
		pos.height = pos.top - ppos.top - 11;
		pos.left += 10;
		pos.top = ppos.top + 21;
		$(this).css(pos);
	});
};

function setPartsData(target, data){
	var d = $.isArray(data) ? data.shift() : data;
	var class_str = "select_box" +
		(target.ccd.part=="wb" ? " bltin_wb" : "") +
		(d.ref.jointPart ? " joint" : "") +
		// (d.ref.conversion ? " conversion" : "") +
		msToClass(d.ref);

	target.value = target.ccd.part=="wb" && d.ref.name=="-" ? Assembly.wb.def : d.ref.name;
	target.className = class_str;
	target.ccd.parts_ref = d.ref;
	target.ccd.tuned = $.extend(true, {}, d.ref);
	$(target.parentNode).controlJoint(data).checkSlot()[d.slt ? "setTuneData" : "dummy"](d.slt).partCalc();
	lineCalc();
};

function calc(){
	var pd = Assembly.bd.sb.ccd.parts_ref, active_ss = $("#EXEC_AURA_SYSTEM").hasClass("active");
	$.each("type,size,cost,capa,hp,str,tec,wlk,fly,tgh".split(","), function(i, s){
		Result[s] = (active_ss && pd.auraStat ? pd.auraStat[s] : pd[s]) || 0;
	});
	Result.bs = pd.builtin && pd.builtin.bs;
	Result.lg = pd.builtin && pd.builtin.lg;

	Result.cost += Assembly.wb.sb.ccd.parts_ref.cost || 0;

	$.each(["lg","hd","bs","am","wp","hdac","fcac"], function(i, prt){
		$(".part_"+prt).each(function(){
			pd = this.ccd_sb.ccd.parts_ref;
			if(active_ss && pd.auraStat) pd = pd.auraStat;
			$.each("cost,capa,hp,str,tec,wlk,fly,tgh".split(","), function(i, s){
				Result[s] += pd[s] || 0;
			});
			if(pd.builtin){
				Result.bs |= pd.builtin.bs;
				Result.lg |= pd.builtin.lg;
			}
		});
	});

	$(".slot").each(function(){
		var tdat = this.ccd.tune_ref;
		Result.cost += tdat.cost || 0;
		if(!tdat.type || tdat.type.indexOf(Result.type)>-1)
			$.each("capa,hp,str,tec,wlk,fly,tgh".split(","), function(i, s){
				Result[s] += tdat[s] || 0;
			});
	});

	Result.reinforce = 0;
	$(".cartridge").each(function(){
		if($(this).hasClass("selected")){
			var prp = this.ccd;
			Result.cost += prp.cst;
			switch(prp.cid){
			case "1":
			case "2":
			case "3":
			case "4":
			case "5":
				Result.capa += (prp.cid-0) * 5 + 70;
				Result.hp += Assembly.cartridge.hpup;
				break;
			case "6":
				Result.capa += 60;
				Result.hp += 15;
				Result.reinforce++;
				break;
			case "52":
				Result.capa += 65;
				Result.hp += 15;
				Result.reinforce++;
				break;
			case "53":
				Result.capa += 70;
				Result.hp += 15;
				Result.reinforce++;
				break;
			case "70":
				Result.capa += 70;
				Result.hp += Assembly.cartridge.hpup;
				break;
			default:
				break;
			}
		}
	});
};

function setDefault(obj, part, cmn, ss){
	if(!ss && typeof obj.name != "string" || obj.name == "") throw "name";

	var joint = JOINT_DEF[part] || {};
	if(obj.jointPart || cmn.jointPart){
		joint = {joint:{}};
		joint.joint[part] = 1;
	}

	obj = $.extend(true, {}, PARTS_DATA_DEF[part], joint, cmn, obj);

	if(obj.type){
		if(part=="bd"){
			obj.type = {l:"陸",a:"空",c:"砲",s:"補"}[obj.type] || "－";
		}else{
			var typ = obj.type.match(/[l陸]/) ? "陸" : "－";
			typ += obj.type.match(/[a空]/) ? "空" : "－";
			typ += obj.type.match(/[c砲]/) ? "砲" : "－";
			typ += obj.type.match(/[s補]/) ? "補" : "－";
			obj.type = typ;
		}
		if(obj.type.match(/^[－]+$/)) throw "Type error @1993";
	}
	if(obj.size && !obj.size.match(/^(SS|S|M|LL|L|-)$/)) throw "Size error @1995";

	$.each("cost,capa,hp,str,tec,wlk,fly,tgh".split(","), function(j, s){
		if(obj[s] && isNaN(obj[s])) throw s;
	});

	var reinforce = 0;
	$.each(["main","sub"], function(j, ms){
		if(obj[ms]){
			var mso = obj[ms] = $.extend(true, {pwr:[0],shl:[0],rng:[0],spd:[0],itv:[0]}, obj[ms]);
			mso.str = mso.str || 0;
			mso.tec = mso.tec || (mso.str>0 ? 0 : 100);
			$.each(["pwr","shl","rng","spd","itv"], function(k, s){
				if(typeof mso[s] == "number") mso[s] = [mso[s]];
				if(reinforce < mso[s].length) reinforce = mso[s].length;
			});
			var shld = mso.itv[0] == 0;
			$.each(["pwr","shl","rng","spd","itv"], function(k, s){
				if((shld || s=="shl") && mso[s][0]==0) for(var l=0; l<mso[s].length; l++) mso[s][l] = "-";
				for(var l=mso[s].length; l<reinforce; l++) mso[s][l] = mso[s][l-1];
			});
		}
	});

	if(part=="bd"){
		obj.cartridge.prp = [];
		$.each([1,6,9], function(n, lv){
			obj.cartridge["lv"+lv].replace(/\|?([0-9]+)(\*([1-9]))?@([0-9]+)/g,
				function(str, cid, dmy, num, cst){
					obj.cartridge.prp.push({
						cid: cid,
						num: num-0 || 1,
						cst: cst-0,
						rqlv: lv
					});
					obj.cartridge[cid] = 1;
				}
			);
		});
	}

	var c = {type:obj.type, size:obj.size},
		f={
		string: function(o, p, naf){
			if(Parts_data.fixed[o]) o = $.extend(true, {}, PARTS_DATA_DEF[p], Parts_data.fixed[o], c);
			else o = $.extend(true, {}, PARTS_DATA_DEF[p], Parts_none, {name:o}, c);
			o = setDefault(o, p, c);
			return naf ? o : [o];
		},
		object: function(o, p, naf){
			if(o.constructor == Array){
				for(var i=0; i<o.length; i++){
					o[i] = f[typeof o[i]](o[i], p, 1);
					if(o[i].num){
						var num = o[i].num;
						delete o[i].num;
						for(var n=1; n<num; n++) o.splice(i, 0, o[i]);
					}
				}
				return o;
			}else{
				o = setDefault(o, p, c);
				if(naf) return o;
				else{
					var oa = [o];
					for(var n=1; n<(o.num||0); n++) oa.push(o);
					return oa;
				}
			}
		}
	};

	if(obj.fixedParts){
		for(var p in obj.fixedParts) obj.fixedParts[p] = f[typeof obj.fixedParts[p]](obj.fixedParts[p], p);
	}

	if(obj.auraStat){
		c = $.extend(true, {}, obj);
		delete c.auraStat;
		obj.auraStat = setDefault(obj.auraStat, part, c, 1);
	}

	if(obj.comment){
		if(typeof obj.comment=="string") obj.comment = [obj.comment];
		else if(obj.comment.constructor==Array) for(var n in obj.comment) obj.comment[n] += "";
		else delete obj.comment;
	}

	return obj;

};

function makeCartridgeLst(){
	$("#CTRG_LIST_CONTAINER").empty();
	$("#CURRENT_LV").text(ADDLEVEL+"/"+MAXLEVEL);
	Result.lv = ADDLEVEL;
	Selected_cartridge = [];
	$.each(Assembly.cartridge.prp, function(i){
		var cm = Master.cartridge[this.cid];
		var ctrg = $("#CTRG_TEMPLATE>.cartridge").clone();
		var ccd = {cid:this.cid, cst:this.cst, rqlv:this.rqlv, cmt:cm.comment.replace(/#hp/, Assembly.cartridge.hpup)+' ('+this.rqlv+'～)'};
			
		ctrg[0].ccd = ccd;
		ctrg.children(".ctrg_name").text(cm.name);
		ctrg.children(".cost").text(this.cst);
		ctrg.appendTo("#CTRG_LIST_CONTAINER");
		for(var j=1; j<this.num; j++)
			ctrg.clone().appendTo("#CTRG_LIST_CONTAINER")[0].ccd = ccd;
	});

	$.each(Master.cartridge.ex, function(i){
		var ctrg = $("#CTRG_TEMPLATE>.cartridge").clone().addClass("ex");
		ctrg[0].ccd = {cid:this.id, cst:this.cost, cmt:this.comment};
		ctrg.children(".ctrg_name").text(this.name);
		ctrg.children(".cost").text(this.cost);
		ctrg.appendTo("#CTRG_LIST_CONTAINER");
	});

	$(".cartridge").mouseenter(function(e){
		$("#CTRG_TOOLTIP").text(this.ccd.cmt).css({left:e.pageX-60, top:e.pageY+15}).show();
	}).mouseleave(function(){
		$("#CTRG_TOOLTIP").hide();
	}).click(function(){
		if($(this).hasClass("ex")) $(this).toggleClass("selected");
		else if(!$(this).hasClass("selected")){
			if(Result.lv < MAXLEVEL && Result.lv >= this.ccd.rqlv-1){
				Selected_cartridge.push(this);
				$(this).addClass("selected");
				Result.lv++;
				$("#CURRENT_LV").text(Result.lv+"/"+MAXLEVEL);
			}
		}
		calc();
		renewRes();
		Prop.changed = true;
	});
};

function autoSetup(ccd){
	var pcnt = {};
	
	$("#OVERLAY").show();
	if(ccd.name){
		Assembly.robo_name.text = ccd.name;
		$(Assembly.robo_name.elm).text(ccd.name);
	}
	$.each(ccd.part, function(i){
		
		
		if(this.part != "wp" && this.name == "-") return;
		pcnt[this.part] = pcnt[this.part] != undefined ? pcnt[this.part] + 1 : 0;

		var elm = $(".part_"+this.part+":visible").eq(pcnt[this.part]), sb, pd = Parts_data[this.part][Parts_data[this.name]];

		if(elm.length) sb = elm[0].ccd_sb;
		else{
			Message.set("Unable to attach "+this.name+" to "+this.part.toUpperCase(), 1);
			return;
		}

		if($(sb).hasClass("fixed")){
			elm.setTuneData(this.slot);
			return;
		}

		if(pd == undefined){
			Message.set('Part data not found ('+this.part+')', 1);
			return;
		}

		if(this.part == "bd"){
			UnRedo(Assembly.bd.sb, 1);
			$(Assembly.bd.elm).children(".branch").clearPartData();
			$("#EXEC_AURA_SYSTEM")[pd.auraSystem ? "show" : "hide"]().removeClass("active");
			Assembly.wb.def = Master.defaultwb[pd.wbid]+"(default)";
			Assembly.wb.sb.value = Assembly.wb.def;
			Assembly.cartridge = pd.cartridge;
			makeCartridgeLst();
			
			if(pd.maxlevel == undefined){
				MAXLEVEL = MAXLEVEL_DEF;
				ADDLEVEL = ADDLEVEL_DEF;
			}
			else
			{
				MAXLEVEL = pd.maxlevel;
				ADDLEVEL = pd.addlevel;
			}
			
		}else{
			var bdpd = Assembly.bd.sb.ccd.parts_ref, str = "";
			if(pd.type.indexOf(bdpd.type) < 0) str = 'Type error @2186';
			if(SIZE_TO_NUMLIC[pd.size] !== "" &&
				Math.abs(SIZE_TO_NUMLIC[bdpd.size] - SIZE_TO_NUMLIC[pd.size]) > 1){
					str += (str ? ',' : "") + 'Size error @2189';
			}
			if(str){
				Message.set(str+' error(s) on "'+this.name+'"', 1);
				return;
			}
		}

		setPartsData(sb, {ref:pd, slt:this.slot});

	});



	$(".cartridge").removeClass("selected");
	Result.lv = ADDLEVEL;
	var cStack = [], j=0;
	
	$.each(ccd.cartridge, function(s,val){
		var t = val.match(/([^×*]+)([×*]([0-9]))?/);
		
		var cname = RegExp.$1, num = (RegExp.$3);
		if(num <= 0)
			{
				num = 1;
			}
		j += parseInt(num);
		
		if(typeof Master.cartridge[cname] == "object") cname = Master.cartridge[cname].name;
		
		$(".cartridge:contains('"+cname+"'):not('.selected')").each(function(i){
			if(i >= num) return;
			if($(this).hasClass("ex")){
				$(this).addClass("selected");
				j--;
			}else if(Result.lv < MAXLEVEL){
				if(Result.lv+1 >= this.ccd.rqlv)
				{
					Selected_cartridge.push(this);
					$(this).addClass("selected");
					Result.lv++;
				}else cStack.push({elm:this,ctrg:cname});
			}
		});
		
	});
	
	if(cStack.length){
		$.each(cStack, function(){
			if(Result.lv+1 >= this.elm.ccd.rqlv)
			{
				Selected_cartridge.push(this.elm);
				$(this.elm).addClass("selected");
				Result.lv++;
			}
		});
	}
	if(Result.lv < j) Message.set("Cartridge error", 1);
	$("#CURRENT_LV").text(Result.lv+"/"+MAXLEVEL);
	
	calc();
	renewRes();
	
	setTimeout('$("#OVERLAY").hide();', 100);
};

function restrictCheck(trg){
	if(trg.ccd.part != "bd"){
		$(trg.ccd.list).children(".riku,.ku,.hou,.ho,.hidden").hide();
		$(TYPE_TO_CLASS[Result.type]).show();
		$(SIZE_TO_CLASS[Result.size]).hide();

		$(trg.ccd.list).children(".conversion").hide();
		var parentPart = trg.parentNode.parentNode.children[1];
		if($(parentPart).hasClass('fixed'))
			$("."+parentPart.ccd.parts_ref.id).show();
		else
			$("."+parentPart.ccd.part.toUpperCase()+parentPart.ccd.parts_ref.id).show();

		if($(trg.parentNode).is(".except_joint")) $(trg.ccd.list).children(".joint").hide();
	}else $(trg.ccd.list).children(".prtlst").show();
}

function renewRes(){
	$.each("type,size,cost,capa,hp,str,tec,wlk,fly,tgh".split(","), function(i, s){
		Res_elms[s].current.text(Result[s]);
		Res_elms[s].add.removeClass("plus").text("");
		Res_elms[s].graph.text("iiiiiiiiiIiiiiiiiiiIiiiiiiiiiIiiiiiiiiiI".substr(0, Result[s]));
	});

	var judgeSortie = Result.cost <= Result.capa;
	Res_elms.check.cost.text(judgeSortie ? "OK" : "NG")
	.add(Res_elms.cost.current)[judgeSortie ? "removeClass" : "addClass"]("ng");

	$.each(["bs","lg"], function(i, s){
		judgeSortie &= Result[s];
		Res_elms.check[s].text(Result[s] ? "OK" : "NG")[Result[s] ? "removeClass" : "addClass"]("ng");
	});

	Res_elms.check.container[judgeSortie ? "removeClass" : "addClass"]("ng");
};

function renewPdv(callerRef, data, sdat, f){
	if(!f){
		if(pdvTimer) clearTimeout(pdvTimer);
		pdvTimer = setTimeout(function(){renewPdv(callerRef, data, sdat, true);}, 80);
		return;
	}
	
	if(data.id == "SL99")
		data = Parts_none;
	
	var islist = true, add_stat = data.add;
	if($("#EXEC_AURA_SYSTEM").hasClass("active")) data = data.auraStat || data;

	if(sdat == undefined){
		sdat = data;
		islist = false;
	}

	$.each(["type","size"], function(i, s){
		Res_elms[s].add.text(data.type!="-" && data.type.length==1 ? data[s] : "");
		PDV_elms[s].current.text(data[s] || "");
	});

	$.each("cost,capa,hp,str,tec,wlk,fly,tgh".split(","), function(i, s){
		var d = data[s] || 0, a = add_stat && add_stat[s] || 0;
		var ac = "remove", sc = "remove";
		d = d - (sdat[s] || 0);
		if(d > 0) sc = "add";
		if(a > 0) ac = "add";
		PDV_elms[s].current.text(data[s] || "");
		PDV_elms[s].add[ac+"Class"]("plus").text(a!=0 ? a : "");
		Res_elms[s].add[sc+"Class"]("plus").text(d!=0 ? d : "");
	});

	Res_elms.cost.add.css("color", Result.cost+(data.cost-sdat.cost)>Result.capa+(data.capa-sdat.capa) ? "red" : "");

	PDV_elms.name.text(data.name || "");
	if (data.id && typeof callerRef === 'object' && callerRef !== null && callerRef.ccd && callerRef.ccd.part) {
		$("#DATA_EDIT_BUTTON").attr("disabled", false)[0].partDataRef = callerRef;
	} else {
		delete ($("#DATA_EDIT_BUTTON").attr("disabled", true)[0].partDataRef);
	}
	PDV_elms.comment.empty();
	if(data.comment) $.each(data.comment, function(n, comment){
			PDV_elms.comment.row.clone().text(comment).appendTo(PDV_elms.comment);
	});
	PDV_elms.materials[data.material != undefined ? "show" : "hide"]().each(function(){
		this.innerHTML = "";
		for(var k in data.material){
			this.innerHTML += Master.material[k]+"×"+data.material[k]+"<br />";
		};
	});

	PDV_elms.main.container.add(PDV_elms.sub.container).hide();
	$(".damage_map tbody tr:visible").hide();
	$(".highlight").removeClass("highlight");
	$.each(["main","sub"], function(i, ms){
		var wpd = data[ms];
		if(wpd){
			var reinforce = wpd.pwr.length > Result.reinforce ? Result.reinforce : wpd.pwr.length-1;
			PDV_elms[ms].container.show();
			$.each(["pwr","shl","rng","spd","itv"], function(i, s){
				//PDV_elms[ms][s].current.text(wpd[s][reinforce]);
				if(isNaN(wpd.pwr[reinforce])) PDV_elms[ms][s].current.text("-");
				else PDV_elms[ms][s].current.text(wpd[s][reinforce]);
			});

			if(isNaN(wpd.pwr[reinforce])) PDV_elms[ms].dmg.current.text("-");
			else{
				var pwr = wpd.pwr[reinforce];
				var st = wpd.str ? "str" : "tec";
				var k = Settings.coefficient[st];
				var str = Result.str + (islist ? (data.str||0)-(sdat.str||0) : 0);
				var tec = Result.tec + (islist ? (data.tec||0)-(sdat.tec||0) : 0);
				str = str<0 ? 0 : (str>40 ? 40 : str);
				tec = tec<0 ? 0 : (tec>40 ? 40 : tec);
				str = wpd.str ? parseInt(str * wpd.str / 100) : 0;
				tec = wpd.tec ? parseInt(tec * wpd.tec / 100) : 0;
				var dmg = parseInt(pwr * (1000+k*(str+tec-10))+000) / 1000; //000 was 500, fixed since squish thought its wrong
				PDV_elms[ms].dmg.current.text(dmg);
				if(pwr>0){
					var obj = $("[pwr="+pwr+"]", PDV_elms.damage_map[st]);
					if(!obj.length){
						var s = '<tr pwr="'+pwr+'"><th>'+pwr+'</th>';
						for(var stat=0; stat<=40; stat++)
							s += '<td'+(stat%2?' class="even">':'>')+parseInt(pwr*(1+k*(stat-10)/1000)+0.0)+'</td>'; //0.5
						obj = $(s+"</tr>").appendTo($("tbody", PDV_elms.damage_map[st]));
					}
					obj.show().children("td:eq("+(str+tec)+")").addClass("highlight");
				}
			}
		}
	});

};

function loadCookieToStorage(){
	var i,boo=-1;
	for(i=0;i<30 && boo;i++){
		("; "+document.cookie+";").replace(RegExp("; "+i+"=([^;]+)"), function(s, val){
			if(val && boo==-1)
				boo = confirm("Saved build(s) found in Cookies. Load them to Local Storage?") ? 1 : 0;
			if(boo==1){
				setStorage(i,unescape(uncompress(val)));
				document.cookie = i + "=" + "xx; expires=Tue, 1-Jan-1980 00:00:00;";
			}
		});
	}
}

function initCookieRead(){
	var i, dat, name;

	for(i=0;i<30;i++){
		dat = getStorage(i);
		name = dat ? dat.split("&")[0] : "no data";
		if(!i) $("#SS_CURRENT_VAL").text('slot 0: '+name);
		$('<div class="ss_item">slot '+i+': '+name+'</div>').appendTo("#SS_LIST")[0].value = i;
	}
	$('.ss_item').click(function(){
		Settings.save_slot = this.value;
		$("#SS_CURRENT_VAL").text($(this).text());
	});

	if(INI.loadSaveData) $.get("savedata.txt", function(data){
		$.each(data.split(/[;\r\n]+/), function(i, dat){
			if(dat!="" && dat.match(/^[a-zA-Z0-9@%|*]+$/)){
				dat = unescape(uncompress(dat));
				$('<div class="ss_item text_data">'+(dat ? dat.split("&")[0] : "no data")+'</div>').appendTo("#SS_LIST")[0].ccd = dat;
			}
		});
		$('.text_data').click(function(){
			if(Prop.changed){
				if(!confirm("Configuration was changed. Do you want to continue?")) return false;
				Prop.changed = false;
			}
			var ccd = this.ccd;
			ccd = readCompData(ccd);
			autoSetup(ccd);
			Message.set("Configuration loaded successfully");
			Prop.changed = false;
		});
	});

};

})(jQuery);

$(function Ex_count(){ //
   	var x = setInterval(function(){
   	var ex_node = document.querySelectorAll('#ASSEMBLE .tuneex').length;
   	document.getElementById("EX_displayCount").innerHTML = ex_node;
   	if (ex_node > 10) {
   		$("#RES_EX.res_item_container").addClass("ng");
   	}
   	if (ex_node <= 10) {
   		$("#RES_EX.res_item_container").removeClass("ng");
   	};
   }, 2500);
});
