const {app, BrowserWindow, ipcMain, ipcRender, contextBridge} = require('electron');
const Store = require('electron-store');
const puppet = require('puppeteer-extra');
const {executablePath} = require('puppeteer');
const pEPS = require('puppeteer-extra-plugin-stealth');
let debugMode = true;
puppet.use(pEPS());
    const url = require("url");
    const path = require("path");

    let mainWindow;

    function createWindow () {
      mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
          nodeIntegration: true,
          preload: path.join(__dirname, `./electron-preloader.js`)
        }
      })

      mainWindow.loadURL(
        url.format({
          pathname: path.join(__dirname, `/dist/cranston-movies/index.html`),
          protocol: "file:",
          slashes: true
        })
      );
      // Open the DevTools.
      mainWindow.webContents.openDevTools()

      mainWindow.on('closed', function () {
        mainWindow = null
      })
    }

    app.on('ready', createWindow)

    app.on('window-all-closed', function () {
      if (process.platform !== 'darwin') app.quit()
    })

    app.on('activate', function () {
      if (mainWindow === null) createWindow()
    });

    function renderHookCommunication(ev, dat){
      ev.reply('renderHookCommunication', dat);
    }
    let multiThreadedTaskManager = {
      multiThreadedTasks:{},
      closeAllThreadsOfType: (typeArr)=>{
        console.log('closing threads');
        Object.keys(multiThreadedTaskManager.multiThreadedTasks).forEach(async (key,index)=>{
          const task = multiThreadedTaskManager.multiThreadedTasks[key];
          if (typeArr.includes(task.task.taskName)) {
            if (task?.browser === undefined) {
              console.log('requesting removal from thread');
              multiThreadedTaskManager.multiThreadedTasks[key].requestClosure = true;
            }
            else{
              console.log('removing thread...');
              await multiThreadedTaskManager.multiThreadedTasks[key].browser.close();
              delete multiThreadedTaskManager.multiThreadedTasks[key];
            }
          }
          else{
            console.log('no match found');
            console.log(task.task);
          }
        });

      },
      addTask: (ev, task)=>{
        (async ()=>{
          let taskId = Object.keys(multiThreadedTaskManager.multiThreadedTasks).length + 1;
          while (multiThreadedTaskManager.multiThreadedTasks[taskId] !== undefined) {
            taskId+=1;
          }
          multiThreadedTaskManager.multiThreadedTasks[taskId] = {
            taskId,
            task
          };
              const browser = await puppet.launch({
                headless:false,
                executablePath: executablePath(),
                frame:false
              });
              if (multiThreadedTaskManager.multiThreadedTasks[taskId]?.requestClosure === true) {
                console.log('we need to close this thread!');
                delete multiThreadedTaskManager.multiThreadedTasks[taskId];
                browser.close();
                return;
              }
              else{
                console.log(multiThreadedTaskManager.multiThreadedTasks[taskId])
              }
              multiThreadedTaskManager.multiThreadedTasks[taskId].browser = browser;
              const newPage = await browser.newPage();
          //ev, dat
          const hasArgs = (typeof task == 'string') ? false : true;
          const useTask = hasArgs? task.taskName : task;
          const args = hasArgs? task.params : undefined;
          const pair = taskFunctions[useTask]({
            usePreGen: true,
            close: 'never',
            pI: newPage,
            pB: browser
          }, args);
          pair.then(e=>{
            renderHookCommunication(ev, {
              eventName: 'multiThreadedTaskManager',
              eventData: {
                task: useTask,
                status: 'success',
                result: e
              }
            });
            delete multiThreadedTaskManager.multiThreadedTasks[taskId];
            browser.close();
          }).catch(e=>{
            renderHookCommunication(task.ev, {
              eventName: 'multiThreadedTaskManager',
              eventData: {
                task: useTask,
                status: 'failure',
                result: e
              }
            });
            delete multiThreadedTaskManager.multiThreadedTasks[taskId];
            browser.close();
          });
        })();
      }
    } 
    let singleThreadedTaskManager = {
      tasks: [],
      state: 'idle',
      puppetInstance:null,
      puppetBrowser:null,
      swapState: (state)=>{
        singleThreadedTaskManager.state = state;
        singleThreadedTaskManager.queueUpdate('stateUpdate');
      },
      queueUpdate: (operation)=>{
        switch (operation) {
          case 'taskAdded': 
          {
            if (singleThreadedTaskManager.state !== 'idle') return;
            singleThreadedTaskManager.swapState('active');
            break;
          }
          case 'stateUpdate':
            {
              switch (singleThreadedTaskManager.state) {
                case 'idle':
                  {
                    //if it turns to idle, first we will generate a new browser window
                    if (singleThreadedTaskManager.tasks.length > 0 ) {
                      singleThreadedTaskManager.swapState('active');
                    }
                    else{
                      singleThreadedTaskManager.puppetBrowser.close();
                      singleThreadedTaskManager.puppetInstance = null;
                      singleThreadedTaskManager.puppetBrowser = null;
                    }
                    break;
                  }
                case 'active':
                  {
                    //we are active, use old browser window
                    (async ()=>{
                    const task = singleThreadedTaskManager.tasks.shift();
                    if (singleThreadedTaskManager.puppetInstance === null) {
                        const browser = await puppet.launch({
                          headless:false,
                          executablePath: executablePath(),
                          frame:false
                        });
                        const newPage = await browser.newPage();
                        singleThreadedTaskManager.puppetBrowser = browser;
                        singleThreadedTaskManager.puppetInstance = newPage;
                    }
                    //ev, dat
                    const hasArgs = (typeof task.task == 'string') ? false : true;
                    const useTask = hasArgs? task.task.taskName : task.task;
                    const args = hasArgs? task.task.params : undefined;
                    const pair = taskFunctions[useTask]({
                      usePreGen: true,
                      close: 'never',
                      pI: singleThreadedTaskManager.puppetInstance
                    }, args);
                    pair.then(e=>{
                      renderHookCommunication(task.ev, {
                        eventName: 'singleThreadedTaskManager',
                        eventData: {
                          task: task.task,
                          status: 'success',
                          result: e
                        }
                      });
                      singleThreadedTaskManager.swapState('idle');
                    }).catch(e=>{
                      renderHookCommunication(task.ev, {
                        eventName: 'singleThreadedTaskManager',
                        eventData: {
                          task: task.task,
                          status: 'failure',
                          result: e
                        }
                      });
                      singleThreadedTaskManager.swapState('idle');
                    });
                  })();
                    break;
                  }
              }
              break;
            }
        }
      },
      addTask: (ev, task)=> {
        singleThreadedTaskManager.tasks.push({ev, task});
        singleThreadedTaskManager.queueUpdate('taskAdded');
      }
    }
    //common func//
    async function soap2day_bypass(page) {
      const btnExists = page.evaluate(()=>{
        return (document.querySelector('#btnhome') !== undefined && document.querySelector('#btnhome') !== null);
      });

      if (btnExists) {
        try{
          await page.waitForSelector('.btn.btn-success:not(:disabled)');
          await page.evaluate(()=>{
            document.querySelector('#btnhome').click();
        });
        await page.waitForNavigation();
        }
        catch(e)
        {

        }
      }
    }
    const taskFunctions = {
      'get_s2drs_search': (details, args)=>{
        return new Promise(async (resolve,reject)=>{
          const {search} = args;
          try {
            const page = details.pI;
            await page.goto(`https://soap2day.rs/search/${encodeURIComponent(search)}`, {waitUntil: 'networkidle0'});
            const breakdown = await page.evaluate(()=>{
              let results = document.querySelectorAll('.flw-item');
              const formatTv = [];
              const formatMovies = Array.from(results).map(e=>{
                return {
                    art: e.children[0].children[0].getAttribute('data-src'),
                    movieName: e.children[1].children[0].children[0].innerText,
                    movieLink:e.children[1].children[0].children[0].href.replace('day.rs/movie/','day.rs/watch-movie/'),
                    releaseDate: ''
                }
            });
            return [formatTv, formatMovies];
            });
            let [formatTv, formatMovies] = breakdown;
            resolve({
              status: formatMovies.length > 0 || formatTv.length > 0 ? 'success' : 'failure',
              tv:formatTv,
              movies:formatMovies
          });
          }
          catch(e)
          {
            reject(e);
          }
        })
      },
      'solarmovies_start_video': (details,args)=>{
        return new Promise(async (resolve,reject)=>{
          const {search} = args;

        })
      },
      'get_solarmovies_search': (details,args)=>{
        return new Promise(async (resolve,reject)=>{
          const {search} = args;
          try
          {
            const page = details.pI;
            await page.goto(`https://solarmovie-online.cam/search/${encodeURI(search)}`, {waitUntil:'networkidle0'});
            await page.waitForSelector('._movies');

            const sResults = await page.evaluate(()=>{
              let [movies, tv] = document.querySelectorAll('._movies');
              movies = Array.from(movies.querySelectorAll('[data-filmname]')).map(e=>{
                return {
                  art: e.querySelector('img').src,
                  movieName: e.getAttribute('data-filmname'),
                  movieLink:e.children[0].href,
                  releaseDate: e.getAttribute('data-year')
                }
              }).sort((a, b)=>{return b.releaseDate - a.releaseDate;});
              let usedNames = [];
              tv = Array.from(tv.querySelectorAll('[data-filmname]')).map(e=>{
                if (usedNames.includes(e.getAttribute('data-filmname').split(' - Season')[0])) return undefined;
                usedNames.push(e.getAttribute('data-filmname').split(' - Season')[0]);
                return {
                  art: e.querySelector('img').src,
                  showName: e.getAttribute('data-filmname').split(' - Season')[0],
                  showLink:e.children[0].href,
                  releaseDate: e.getAttribute('data-year'),
                  seasons:'unknown'
                }
              }).filter(e=>e!==undefined).sort((a, b)=>{return b.releaseDate - a.releaseDate;});

              return {
                status: movies.length > 0 || tv.length > 0 ? 'success' : 'failure',
                tv,
                movies
            };

            });
            resolve(sResults);
          }
          catch(e)
          {
            reject(e);
          }
        })
      },
      soap2day_start_video: (details,args)=>{
        return new Promise(async (resolve, reject)=>{
          const {search} = args;
          try 
          {
            const page = details.pI;
            await page.goto(search, {waitUntil: 'networkidle0'});  
            await soap2day_bypass(page);
            await page.waitForSelector('video');
            const src = await page.evaluate(()=>{
              return document.querySelector('video').src;
            });
            resolve(src);
          }
          catch (e)
          {
            reject(e);
          }
        })
      },
      master_search_service: (details, args) => {
        return new Promise(async (resolve, reject)=>{
          const {search, type} = args;
          if (search.includes('soap2day.mx')) 
          {
            //soap2day search
            try 
            {
              switch (type) {
                case "movie":
                  {
                    console.log('movie hook');
                    const page = details.pI;
                    await page.goto(search, {waitUntil: 'networkidle0'});  
                    await soap2day_bypass(page);
                    await page.waitForSelector('video');
                    let breakdown = await page.evaluate(()=>{
                      const src = document.querySelector('video').src;
                      const headings = document.querySelectorAll('h4');
                      const title = headings[0].innerText;
                      const genres = headings[3]?.nextSibling?.nextSibling?.innerText;
                      const release = headings[4]?.nextSibling?.nextSibling?.innerText.split('-')[0];
                      const rating = headings[5]?.nextSibling?.nextSibling?.innerText.split(' from')[0];
                      const desc = document.querySelector('p#wrap').innerText;
                      const thumbnail = document.querySelector('.thumbnail > img').src;
                      return {
                        src,
                        title,
                        genres,
                        release,
                        rating,
                        desc,
                        thumbnail,
                      }
                    });
                    breakdown.sender = 'soap2day';
                    breakdown.requestType = type;
                    console.log(breakdown);
                    resolve(breakdown);
                  }
                  case "show":
                    {
                      const page = details.pI;
                      await page.goto(search, {waitUntil: 'networkidle0'});  
                      await soap2day_bypass(page);
                      await page.waitForSelector('.alert-info-ex');
                      const breakdown =  await page.evaluate(()=>{
                        const seasons = Array.from(document.querySelectorAll('.alert-info-ex'));
                        const seasonInfo = seasons.map(e=>{
                          return {
                            seasonNumber: e.querySelector('h4').innerText.replace('Season','').replace(' :', ''),
                            seasonEpisodes: Array.from(e.querySelector('div').children).map(a=>{
                              return {
                                parentSeason: e.querySelector('h4').innerText.replace('Season','').replace(' :', ''),
                                episodeNumber: a.children[0].innerText.split('.')[0],
                                episodeName: a.children[0].innerText.replace(`${a.children[0].innerText.split('.')[0]}.`, ''),
                                episodeUrl: a.children[0].href
                              }
                            })
                          }
                        });
                        const headings = document.querySelectorAll('h4');
                        const title = headings[0].innerText;
                        const genres = headings[3]?.nextElementSibling?.nextElementSibling?.innerText;
                        const release = headings[4]?.nextSibling?.nextSibling?.innerText.split('-')[0];
                        const rating = headings[5]?.nextSibling?.nextSibling?.innerText.split(' from')[0];
                        const desc = document.querySelector('p#wrap').innerText;
                        const thumbnail = document.querySelector('.thumbnail > img').src;
                        return {
                          title,
                          genres,
                          release,
                          rating,
                          desc,
                          thumbnail,
                          seasonInfo,
                          sender: 'soap2day'
                        }
                      });
                      breakdown.requestType = type;
                      console.log(breakdown);
                      resolve(breakdown);

                    }
              }
            }
            catch (e)
            {
              console.log('error');
              console.log(e);
            }
          }
          else if (search.includes('solarmovie'))
          {
            try
            {
              switch(type) {
                case 'movie':
                  {
                    const page = details.pI;
                    await page.setRequestInterception(true);
                    page.on('request', request => {
                      if (request.isNavigationRequest() && request.redirectChain().length !== 0) {
                        request.abort();
                      }
                      else 
                      {
                        request.continue();
                      }
                    });
                    await page.goto(search, {waitUntil: 'networkidle0'});  
                    await page.waitForSelector('video');
                    const rt = await page.evaluate(()=>{
                      const info = document.querySelector('#info');
                      return {
                        src: document.querySelector('video').src,
                        title: info.querySelector('h1').innerText,
                        genres: Array.from(info.querySelectorAll('a[href*="/genre/"]')).map(e=>e.innerText).join(),
                        release: info.querySelector('a[href*="/year/"]').innerText,
                        rating:info.querySelector('a[href*="/year/"]').parentNode.parentNode.nextElementSibling.children[1].innerText,
                        desc:info.children[0].children[1].children[2].innerText,
                        thumbnail:info.previousElementSibling.children[0].querySelector('img').getAttribute('data-src')
                      }
                    });
                    rt.sender = 'solarmovies';
                    rt.requestType = type;
                    resolve(rt);
                    break;
                  }
                  case 'show':
                    {
                      const page = details.pI;
                      await page.setRequestInterception(true);
                      page.on('request', request => {
                        if (request.isNavigationRequest() && request.redirectChain().length !== 0) {
                          request.abort();
                        }
                        else 
                        {
                          request.continue();
                        }
                      });
                      await page.goto(search, {waitUntil: 'networkidle0'});  

                      break;
                    }
              }
            }
            catch (e)
            {
              reject(e);
            }
          }
          else if (search.includes('soap2day.rs')){
            try
            {
              switch(type)
              {
                case "movie":
                  {
                    const page = details.pI;
                    await page.goto(search, {waitUntil: 'networkidle0'});  
                    await page.waitForSelector('video');
                    console.log('video loaded??');
                    break;
                  }
              }
            }
            catch(e)
            {
              reject(e);
            }
          }
        });
      },
      get_hdtoday_search:(details, args)=>{
        return new Promise(async (resolve,reject)=>{
          const {search} = args;
          try {
            const page = details.pI;
            await page.goto(`https://hdtoday.to/search/rick-and-morty}`, {waitUntil: 'networkidle0'});
            await page.waitForSelector('.flw-item');
            console.log('item exists)');
            const titles = await page.evaluate(()=>{
              let movies = [];
              let tv = [];
              Array.from(document.querySelectorAll('.flw-item')).forEach(e=>{
                e.querySelector('.fdi-type').innerText == "TV" ? tv.push(e) : movies.push(e);
              });
              // const formatMovies = Array.from(movies).map(e=>{
              //     return {
              //         art: e.children[0].children[0].children[0].src,
              //         movieName: e.children[1].children[0].innerText,
              //         movieLink:e.children[1].children[0].children[0].href,
              //         releaseDate: parseInt(e.children[0].children[1].innerText.split('-')[0])
              //     }
              // }).sort((a, b)=>{return b.releaseDate - a.releaseDate;});
              // const formatTv = Array.from(tv).map(e=>{
              //     return {
              //         art: e.children[0].children[0].children[0].src,
              //         showName: e.children[1].children[0].children[0].innerText,
              //         showLink:e.children[1].children[0].children[0].href,
              //         releaseDate: parseInt(e.children[0].children[1].innerText.split('-')[0]),
              //         seasons:parseInt(e.children[1].children[0].children[1].innerText.replace('[','').replace(']','').split('x')[0])
              //     }
              // }).sort((a, b)=>{return b.releaseDate - a.releaseDate;});
      
              return {
                  // status: formatMovies.length > 0 || formatTv.length > 0 ? 'success' : 'failure',
                  tv:tv,
                  movies:movies
              };
          });
          console.log(titles);
          resolve(titles)
          }
          catch (e) {

          }
        })
      },
      get_soap2day_search: (details, args) => {
        return new Promise(async (resolve,reject)=>{
          const {search} = args;
          try {
            const page = details.pI;
            await page.goto(`https://soap2day.mx/search/keyword/${encodeURIComponent(search)}`, {waitUntil: 'networkidle0'});
            await soap2day_bypass(page);
            //once we get past the robo blocker
            console.log('after nav');
            const titles = await page.evaluate(()=>{
              let [movies, tv] = document.querySelectorAll('.panel-info');
              movies = movies.querySelectorAll('.thumbnail'),
              tv = tv.querySelectorAll('.thumbnail');
              const formatMovies = Array.from(movies).map(e=>{
                  return {
                      art: e.children[0].children[0].children[0].src,
                      movieName: e.children[1].children[0].innerText,
                      movieLink:e.children[1].children[0].children[0].href,
                      releaseDate: parseInt(e.children[0].children[1].innerText.split('-')[0])
                  }
              }).sort((a, b)=>{return b.releaseDate - a.releaseDate;});
              const formatTv = Array.from(tv).map(e=>{
                  return {
                      art: e.children[0].children[0].children[0].src,
                      showName: e.children[1].children[0].children[0].innerText,
                      showLink:e.children[1].children[0].children[0].href,
                      releaseDate: parseInt(e.children[0].children[1].innerText.split('-')[0]),
                      seasons:parseInt(e.children[1].children[0].children[1].innerText.replace('[','').replace(']','').split('x')[0])
                  }
              }).sort((a, b)=>{return b.releaseDate - a.releaseDate;});
      
              return {
                  status: formatMovies.length > 0 || formatTv.length > 0 ? 'success' : 'failure',
                  tv:formatTv,
                  movies:formatMovies
              };
          });
          resolve(titles)

          }
          catch(e){
            reject(e);
          }
        })
      },
      get_trending_movies: (details, args=undefined)=>{ //gets latest trending movies
        return new Promise(async (resolve, reject)=>{
          try {
            const page = details.pI;
            await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4182.0 Safari/537.36");
            await page.goto('https://www.imdb.com/search/title/?title_type=movie');
            const movies = await page.evaluate(()=>{
              let tvShows = [];
              Array.from(document.querySelector('div.lister-list').children).forEach(tvShow=>{
                function resizeImage(src){
                  const HEIGHT = 190;
                  const WIDTH = 281;
                  const img = src.split('_V1_');
                  return img[0] += `_V1_QL75_UY281_CR18,0,${HEIGHT},${WIDTH}_.jpg`; 
                }
                  const banner = resizeImage(tvShow.querySelector('img').getAttribute('loadlate') || tvShow.querySelector('img').src);
                  const showTitle = tvShow.querySelector('.lister-item-header').children[1].innerText;
                  const rating = tvShow.querySelector('.ratings-imdb-rating')?.innerText;
                  const details = tvShow.querySelector('.lister-item-header').nextElementSibling;
                  const age = details.querySelector('.certificate')?.innerText ?? 'Not Rated';
                  const desc = tvShow.querySelector('.ratings-bar')?.nextElementSibling?.innerText ?? tvShow.querySelector('.lister-item-header').nextElementSibling.nextElementSibling.innerText;
                  const genres = details.querySelector('.genre').innerText;
                  const releaseDate = tvShow.querySelector('.lister-item-year')?.innerText ?? 'unknown';
                  const director = tvShow.querySelector('.lister-item-content').lastElementChild.className == 'sort-num_votes-visible' ? tvShow.querySelector('.lister-item-content').lastElementChild.previousElementSibling : tvShow.querySelector('.lister-item-content').lastElementChild;
                  const realDirector = director.children[0].innerText;
                  const url = tvShow.querySelector('.lister-item-header').querySelector('a').href;
                  tvShows.push({
                      banner,
                      showTitle,
                      rating,
                      age,
                      genres,
                      desc,
                      releaseDate,
                      realDirector,
                      url
                  });
              });
              return tvShows;
          });
            resolve (movies);
          }
          catch (e) {
            reject(e);
          }
        })
      },
      get_trending_shows: (details, args=undefined)=>{ //gets latest trending shows
        return new Promise(async (resolve, reject)=>{
          try {
            const page = details.pI;
            await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4182.0 Safari/537.36");
            await page.goto('https://www.imdb.com/search/title/?title_type=tv_series');
            const movies = await page.evaluate(()=>{
              let tvShows = [];
              Array.from(document.querySelector('div.lister-list').children).forEach(tvShow=>{
                function resizeImage(src){
                  const HEIGHT = 190;
                  const WIDTH = 281;
                  const img = src.split('_V1_');
                  return img[0] += `_V1_QL75_UY281_CR18,0,${HEIGHT},${WIDTH}_.jpg`; 
                }
                  const banner = resizeImage(tvShow.querySelector('img').getAttribute('loadlate') || tvShow.querySelector('img').src);
                  const showTitle = tvShow.querySelector('.lister-item-header').children[1].innerText;
                  const rating = tvShow.querySelector('.ratings-imdb-rating')?.innerText;
                  const details = tvShow.querySelector('.lister-item-header').nextElementSibling;
                  const age = details.querySelector('.certificate')?.innerText ?? 'Not Rated';
                  const desc = tvShow.querySelector('.ratings-bar')?.nextElementSibling?.innerText ?? tvShow.querySelector('.lister-item-header').nextElementSibling.nextElementSibling.innerText;
                  const genres = details.querySelector('.genre').innerText;
                  const releaseDate = tvShow.querySelector('.lister-item-year')?.innerText ?? 'unknown';
                  const director = tvShow.querySelector('.lister-item-content').lastElementChild.className == 'sort-num_votes-visible' ? tvShow.querySelector('.lister-item-content').lastElementChild.previousElementSibling : tvShow.querySelector('.lister-item-content').lastElementChild;
                  const realDirector = director.children[0].innerText;
                  const url = tvShow.querySelector('.lister-item-header').querySelector('a').href;
                  tvShows.push({
                      banner,
                      showTitle,
                      rating,
                      age,
                      genres,
                      desc,
                      releaseDate,
                      realDirector,
                      url
                  });
              });
              return tvShows;
          });
            resolve (movies);
          }
          catch (e) {
            reject(e);
          }
        })
      }
    }
    ipcMain.on('closeMultiThreadByTypes', (event, types)=>{
      multiThreadedTaskManager.closeAllThreadsOfType(types);
    });
    ipcMain.on('multiThreadedTask', (event,taskName)=>{
      const pair = taskFunctions?.[taskName] || taskFunctions?.[taskName.taskName];
      if (pair !== undefined && pair !== null)
      {
        multiThreadedTaskManager.addTask(event, taskName);
      }
      else
      {
        console.error('bla');
      }
    });

    ipcMain.on('singleThreadedTask', (event,taskName)=>{
      const pair = taskFunctions?.[taskName] || taskFunctions?.[taskName.taskName];
      if (pair !== undefined && pair !== null)
      {
        singleThreadedTaskManager.addTask(event, taskName);
      }
      else
      {
        console.error('bla');
      }
    });
    function objectPath(data) {
      const {stor, dataPath, method} = data;
      let usedPaths = [];
      function oldDataPath(){
        let obj = item;
        usedPaths.forEach(path=>{
         obj = obj?.[path];
        });
        return obj;
      }
      let item = stor;
      let usedPath = dataPath.split('/');
      usedPath.forEach((path, i)=>{
        let oldPath = oldDataPath();
        switch (method) {
          case "create":
            {
              const {finalData} = data;
              if ((i+1) == usedPath.length)
              {
                oldPath[path] = finalData
              }
              else
              {
                if (oldPath[path] === undefined) 
                {
                  oldPath[path] = {}
                }
              }
              usedPaths.push(path);
              break;
            }
          case "get":
            {
              if ((i+1) == usedPath.length)
              {
                item = oldPath?.[path];
                return;
              }
              else{
                if (oldPath[path] === undefined) {item = undefined; return;}
              }
              usedPaths.push(path);
              break;
            }
        }

      })
      return item;
      }
    ipcMain.on('advancedStorageOperation', (event, arg)=>{
      const internalStorage = new Store;
      let stor = internalStorage.get('advancedStorage');
      if (stor===undefined) {
        internalStorage.set('advancedStorage', {});
        stor = {}
      }
      // watchHistory/Jacob/Shows/2005->Doctor Who/S1/E3 {name, resumeUrl}
      const {method, dataPath} = arg;
      switch (method) {
        case "store":
          {
            const {store} = arg;
            objectPath({
              stor,
              dataPath,
              finalData: store,
              method: 'create'
            });
            internalStorage.set('advancedStorage', stor)
            break;
            console.log(stor);
          }
        case "get":
          {
            const {returnOperation} = arg;
            renderHookCommunication(event, {
              eventName: 'advancedStorageOperation',
              eventData: {
                status: 'success',
                task: returnOperation,
                result:objectPath({
                  stor,
                  dataPath,
                  method:'get'
                })
              }
              
            });
            break;
          }
      }
    })
    ipcMain.on('storageOperation', (event,arg)=>{
      const internalStorage = new Store;

      const {method, dataName} = arg;
      switch (method) {
        case "delete":
          {
            internalStorage.delete(dataName);
            break;
          }
        case "store":
          {
            const {dataValue} = arg;
            if (internalStorage.get(dataName) !== undefined && internalStorage.get(dataName) !== null && arg?.overrides === false) {
              internalStorage.set(dataName, internalStorage.get(dataName).concat(dataValue));
            }
            else{
              internalStorage.set(dataName, dataValue);
            }
            break;
          }
          case "get":
          {
            const {returnOperation} = arg;
            console.log(`get operation on ${dataName}`);
            console.log(internalStorage.get(dataName));
            renderHookCommunication(event, {
              eventName: returnOperation,
              eventData: internalStorage.get(dataName)
            });
            break;
          }
      }
    });

    ipcMain.on('test', (event, arg) => {
      console.log('test invoked, :');
      console.log(arg) // Prints 'Hello from Angular!'
      event.reply('renderHookCommunication', {
        eventName: 'test response'
      });
    })