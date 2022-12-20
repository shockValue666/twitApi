require("dotenv").config({ path: __dirname + "/.env" });
const { twitterClient } = require("./twitterClient.js")
var images = require("images");
const { createClient } = require('@supabase/supabase-js')
const download = require('image-downloader');

const CronJob = require("cron").CronJob;
const express = require("express")


const app = express()
const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})


async function downloadImage(url, filepath) {
    return await download.image({
       url,
       dest: filepath 
    });
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)





let count = 0;

const tweet = async () => {

    count++;
    console.log("count: ",count)
    if(count==2){
        clearInterval(this)
        console.log("count is 2!!!")
    }
    else{
        try {
            await twitterClient.v2.tweet(`Hello world! ${count*count*count}`);
        } catch (e) {
            console.log(e)
        }
    }
}

const singleTweet = async () =>{
    try {
        await twitterClient.v2.tweet("welcome @shockingClit")
    } catch (error) {
        console.log("error: ",error)
    }
}


const drawImage = (src,name) =>{

    images(src)   
        .size(230)
        .save(`${name}.jpg`)

    
}


const getAccountsToPost = async () =>{
    const { data, error } = await supabase
        .from('info')
        .select()
        .gte('id', 39)
        // .eq('id', 37)
        // .eq("accepted",'accepted')
        // .eq("tweeted",false)

    if(data){
        console.log("data: ",data)
        const idArray = data.map(dat=>dat.id)
        const sortedArray = idArray.sort((a,b)=>{
            return a-b
        })
        //make accepted conditional
        const picAndName = data.map((dat)=>({name:dat.twitter_handle,pic:`${dat.avatar.slice(0,dat.avatar.length-11)}.jpg`,id:dat.id}))
        return picAndName;

    }else{
        console.log("error: ",error)
    }
}


const downloadTheImagesOfAccounts = async (picAndName) =>{
    //  picAndName.forEach(({name,pic}) => {
    //     console.log("pic: ",pic);
    //     // const half = pic.slice(0,pic.length-11) + ".jpg"
    //     // console.log("half: ",half)
    //     downloadImage(pic,`/Users/michalislazaris/Desktop/twitterBot/images/${name}.jpg`)
    //     // drawImage(`images/${name}.jpg`)
    //     console.log("name: ",name)
    //     setTimeout(()=>{
    //         console.log("time out")
    //     },1000)
    // })

    for(data of picAndName){
        console.log("pic: ",data.pic);
        // await downloadImage(data.pic,`/Users/michalislazaris/Desktop/twitterBot/images/${data.name}.jpg`)
        await downloadImage(data.pic,`${__dirname}/images/${data.name}.jpg`)
        console.log("name: ",data.name)
    }
}

const drawImagesAccount = (picAndName) =>{
    for(i=0;i<picAndName.length;i++){
        console.log(`images/${picAndName[i].name}.jpg`)
        drawImage(`images/${picAndName[i].name}.jpg`,`drawnImages/${picAndName[i].name}`)
        images("./lablistr/6A.jpeg").draw(images(`drawnImages/${picAndName[i].name}.jpg`), 867, 202).save(`outputImages/${picAndName[i].name}.jpg`);
        //1200 x 675
    }
}

const tweetImagesAndText = async (picAndName) =>{
    for(i=0;i<picAndName.length;i++){
        try {
            const mediaId = await twitterClient.v1.uploadMedia(`outputImages/${picAndName[i].name}.jpg`);
            await twitterClient.v2.tweet({
                text: `Congratulations @${picAndName[i].name}! You have made it to the lablist`,
                media: {
                    media_ids: [mediaId]
                }
            });   
        } catch (error) {
            console.log("error: ",error)
        }
    }
}


const updateDb = async (picAndName) => {
     for(i=0;i<picAndName.length;i++){
        const id = picAndName[i].id
        console.log("id: ",id, " name: ",picAndName[i].name)


        let { data,error } = await supabase.from('info').update({tweeted:true}).eq("id",picAndName[i].id).select();

        if(data){
            console.log("data: ",data)
        }else if(error){
            console.log("error: ",error)
        }
    }
}


const executeEverything = async () =>{
    const accountsToPost = await getAccountsToPost();    
    console.log("accountsToPost: ",accountsToPost)
    await downloadTheImagesOfAccounts(accountsToPost);
    drawImagesAccount(accountsToPost)
    await tweetImagesAndText(accountsToPost)
    await updateDb(accountsToPost)
}

const cronTweet = new CronJob("* * * * *", async () => {
    await executeEverything();
});



cronTweet.start();

// executeEverything()

// drawImage();

// singleTweet();

// setInterval(tweet,12000)

// tweet();@shockingClit