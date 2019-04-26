function Utils(){
    
    Object.prototype.nameof = function(obj) {
          return Object.keys(obj)[0];
    };
    
    this.toArrayBuffer=function(str) {
        var ab = new ArrayBuffer(str.length);
        var view = new Uint8Array(ab);
        for (var i = 0; i < buf.length; ++i) {
            view[i] = buf[i];
        }
        return ab;
    }
    
    this.toBuffer=function(str) {
        return new Buffer(str);
    }
    
    this.getByteLength=function(str) {
         return Buffer.byteLength(str, 'utf8');
    }
    
    this.syncObject=function(obj, sourceObj){
        for(const propName in obj){
            if (sourceObj[propName]) {
                obj[propName] = sourceObj[propName];
            }
        };
    };

    this.mergeObject=function(obj, sourceObj){
        for(const propName in sourceObj){
            if (sourceObj[propName]) {
                obj[propName] = sourceObj[propName];
            }
        };
    };
    
    this.wait=function(intervalsInMilliseconds, timeoutInMilliseconds, cbInterval, cbComplete, cbTimeout){
        let interval = setInterval(async() => {
            const obj = await cbInterval();
            if (obj){
                clearInterval(interval);
                interval = null;
                await cbComplete(obj);
            }
        },intervalsInMilliseconds);
        if (timeoutInMilliseconds > 0 && cbTimeout){
            setTimeout(async()=>{
                if (interval){
                    clearInterval(interval);
                    await cbTimeout();
                }
            },timeoutInMilliseconds);
        }
    };
    
    this.log=(source, message, obj)=>{
        if (message && obj){
            console.log(`${JSON.stringify(new Date())} ${source}: ${message}`, obj);
        } else if(message){
            console.log(`${JSON.stringify(new Date())} ${source}: ${message}`);
        }
    };
    
    this.isEmptyObject=function(obj) {
        for(var prop in obj) {
            if(obj.hasOwnProperty(prop))
                return false;
        };
        return JSON.stringify(obj) === JSON.stringify({});
    };
    
    this.generateGUID=function(argument) {
        function S4() {
            return (((1 + Math.random()) * 0x10000) |0).toString(16).substring(1); 
        }
        return (S4() + S4() + "-" + S4() + "-4" + S4().substr(0, 3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
    };
    
    this.getFunctionName=function(func) {
      var ret = func.toString();
      ret = ret.substr('function '.length);
      ret = ret.substr(0, ret.indexOf('('));
      return ret;
    };

    this.getFunctionParams=function(func){
      return func.toString ().replace (/[\r\n\s]+/g, ' ').
              match (/(?:function\s*\w*)?\s*(?:\((.*?)\)|([^\s]+))/).
              slice (1,3).
              join ('').
              split (/\s*,\s*/);
    };

    this.getRandomNumber=function(min, max){
      return Math.floor(Math.random()*(max-min+1)+min);
    };
    
    this.getJSONString=function(data, includeFunctions){
       try{
          return JSON.stringify(data, function(key, value) {
            if (typeof value === "function" && includeFunctions === true) {
              return "/Function(" + value.toString() + ")/";
            }
            return value;
          });
       }catch(err){
         console.log("error creating json string",err);
         return null;
       }
    };

    this.getJSONObject=function(jsonString, includeFunctions){
      try{
          const dateFormat = /^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(.[0-9]+)?(Z)?$/;
          return JSON.parse(jsonString, function(key, value) {
            if (typeof value === "string" && dateFormat.test(value)) {
              return new Date(value);
            }
            if (typeof value === "string" && value.startsWith("/Function(") && value.endsWith(")/") && includeFunctions===true) {
              value = value.substring(10, value.length - 2);
              return eval("(" + value + ")");
            }
            return value;
          });

      }catch(err){
        console.log("error parsing json",err);
        return null;
      }
    };

    this.getHostAndPortFromUrl=function(url){
        var addressSplit=url.replace('http://','')
                                  .replace('https://','')
                                  .split(':');
        const host=addressSplit[0].split('/')[0];
        const port=addressSplit[1].split('/')[0];
        console.log('port', port);
        return {
            host: host,
            port: port
        };
    };

    this.isValidUrl=function(url){
        var pattern1= new RegExp('^(http?:\\/\\/)?'+ // protocol
          '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|'+ // domain name
          '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
          '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
          '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
          '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
        var pattern2= new RegExp('^(https?:\\/\\/)?'+ // protocol
          '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|'+ // domain name
          '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
          '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
          '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
          '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
        return pattern1.test(url) || pattern2.test(url);
    };

    this.getUrlPath=function(url){
        var url_parts = require('url').parse(url);
        return url_parts.pathname;
    };

    this.readJsonFile=function(dirPath, name, callback){
        var filePath=`${dirPath}/${name}`;
        filePath=filePath.replace('.json','');
        filePath=`${filePath}.json`;
        const fs=require('fs');
        fs.readFile(filePath, 'utf8', function(err, jsonStr){
            const data=module.exports.getJSONObject(jsonStr);
            callback(data);
        });
    };
    
    this.readHtmlFile=function(dirPath, name, callback){
        var filePath=`${dirPath}/${name}`;
        filePath=filePath.replace('.html','');
        filePath=`${filePath}.html`;
        const fs=require('fs');
        fs.readFile(filePath, 'utf8', function(err, html){
            callback(html);
        });
    };
    
    this.readJavaScriptFile=function(dirPath, name, callback){
        var filePath=`${dirPath}/${name}`;
        filePath=filePath.replace('.js','');
        filePath=`${filePath}.js`;
        const fs=require('fs');
        fs.readFile(filePath, 'utf8', function(err, javascript){
            callback(javascript);
        });
    };

    this.replaceJsonFile=function(dirPath, name, data){
        var filePath=`${dirPath}/${name}`;
        filePath=filePath.replace('.json','');
        filePath=`${filePath}.json`;
        filePath=filePath.replace('node_modules/utils/','');
        const fs=require('fs');
        fs.unlink(filePath, function(err) {
           // Ignore error if no file already exists   
           if (err && err.code !== 'ENOENT') {
              throw err;
           }
           const dataStr = module.exports.getJSONString(data);
           var options = {
              flag: 'w'
           };
           fs.writeFile(filePath, dataStr, options, function(err) {
              if (err) {
                 throw err;
              }
           });
        });
    };

    this.getFunctions=function(obj, callback){
      for(const prop in obj){
        if (typeof obj[prop] === "function"){
          callback(prop, obj[prop]);
        }
      };
    }

  this.getCanvasMousePos=(mouse, canvas)=>{
  	const rect = canvas.getBoundingClientRect();
  	return {
  		x: mouse.x - rect.left,
  		y: mouse.y - rect.top
  	};
  }
    
  this.getRemainingDays = (month) =>{
    const currentDate = new Date();
    let year = currentDate.getFullYear();
    const oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
    const newDate = new Date();
    if (month < (currentDate.getMonth()+1)) {
      year = year + 1;
    } 
    newDate.setFullYear(year);
    newDate.setMonth(month-1);
    const lastDayOfSelectedMonth = new Date(newDate.getFullYear(), newDate.getMonth()+1, 0).getDate();
    const currentDay = currentDate.getDate();
    newDate.setDate(lastDayOfSelectedMonth);

    return Math.round(Math.abs((newDate.getTime() - currentDate.getTime())/(oneDay)));
  }

  this.getCurrentMonth = () =>{
    const currentDate = new Date();
    return currentDate.getMonth()+1;
  }
}
