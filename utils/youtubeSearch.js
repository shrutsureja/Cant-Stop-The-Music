import axios from 'axios';

// Search Function which fetches simple HTML and then Process it and finds the Video list and extracts the 1st video for now
// Input : Song Name / Search Query
// Output : returns the {title, watchUrl} for the query
async function search(query) {
  const base = "https://www.youtube.com/results";
  
  try{
    const response = await axios.get(base, {
      params : {
        app: 'desktop',
        search_query: query
      }
    });
    const html = response.data;
    const findInitialData = html.match(/var ytInitialData = {(.*?)};/g)[0];
    const fixData = findInitialData.replace(/var ytInitialData = /g, '');
    const initialData = JSON.parse(fixData.slice(0, -1));
    
    // Find the array of video data objects in the initial data object
    let data = initialData.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents;
    let index, confirm = false;
    for (let i = 0; i < data.length; i++) {
      if (confirm) break;
      if (data[i].hasOwnProperty('itemSectionRenderer')) {
        for (let j = 0; j < data[i].itemSectionRenderer.contents.length; j++) {
          if (data[i].itemSectionRenderer.contents[j].hasOwnProperty('videoRenderer')) {
            index = i;
            confirm = true;
            break;
          }
        }
      }
    }
    
    // If video data objects were found, return them. Otherwise, throw an error.
    if (typeof data[index] === 'object' && data[index].hasOwnProperty('itemSectionRenderer')) {
      data = data[index].itemSectionRenderer.contents;
      const videoData = data.filter(video => video.videoRenderer).map(item => {
        const videoRenderer = item.videoRenderer;
        const title = videoRenderer.title.runs[0].text;
        const watchUrl = "https://www.youtube.com/watch?v=" + videoRenderer.videoId;
        
        return {
          title,
          watchUrl
        }
      });
      return videoData[0];
    } else {
      throw new Error(`No results were found for search query '${query}'.`);
    }
  } catch (error) {
    throw new Error(`Error searching for query '${query}': ${error.message}`);
  }
}

async function spotifytoyoutube(playlists) {
  // all the Playlist are passed here
  const responsePromise = playlists.map(async (item) => {
    // Now Search Begins for each single Playlist
    //  item is a single playlist

    // results store each track details, existing details + ytDetails(youtube title and youtube watch link)
    let results = [];

    // all the tracks are searched on youtube here one by one 
    const trackedPromise = item.trackDetails.map(async ( track ) => {
      const query = track.name + " by " + track.artist;
      const ytDetails = await search(query);
      results.push({...track, ytDetails});
    });

    // waiting for all the tracks data to comeback
    await Promise.all(trackedPromise);

    // destructring the the playlist details and then adding the new details
    const {trackDetails, ...rest} = item;
    return {...rest, trackDetails : results};
  });

  // awaiting for all the responses and the playlist data to comeback  
  let response;
  await Promise.all(responsePromise)
  .then((resolvedValue) => response = resolvedValue)
  .catch((err)=>{
    console.log("error is " + err);
    throw Error (err);
  });
  return response;
}

export {
  spotifytoyoutube
}