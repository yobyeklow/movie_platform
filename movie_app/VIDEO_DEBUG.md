# Video Player Debug Guide

## 🔍 **Common Issues & Solutions**

### **Issue: Player Stuck on "Loading"**

#### **Possible Causes:**

| Cause | Description | Solution |
|-------|-------------|----------|
| **YouTube API not loaded** | The YouTube IFrame API script failed to load | Check browser console for script errors |
| **Invalid Video ID** | Video ID from TMDb is malformed or empty | Verify video ID format (11 characters, alphanumeric) |
| **Video removed** | Video has been removed from YouTube | Check if video exists on YouTube |
| **Embed not allowed** | Video owner disabled embedding | Look for error 101 or 150 |
| **API script timing** | API loaded but player initialized too early | Check the improved VideoPlayer.tsx |

---

## 🧪 **Debug Steps**

### **Step 1: Open Browser Console**
- Press `F12` (Windows/Linux) or `Cmd+Option+I` (Mac)
- Go to the "Console" tab
- Look for messages starting with:

```
=== Video Data Debug ===
VideoPlayer mounted, videoId: xxx
Loading YouTube IFrame API...
YouTube IFrame API loaded
YouTube player ready
```

### **Step 2: Check Console Messages**

| Message | Meaning |
|---------|---------|
| `Loading YouTube IFrame API...` | Script is loading (wait) |
| `YouTube IFrame API loaded` | API is ready |
| `YouTube player ready` | Player initialized successfully |
| `Initializing YouTube player for video: xxx` | Player is being created |
| `Player state changed: 1` | Video is playing |
| `Player state changed: 2` | Video is paused |
| `YouTube Player Error: 100` | Video not found |
| `YouTube Player Error: 101` | Embed not allowed |
| `YouTube Player Error: 150` | Video embedding forbidden |

### **Step 3: Test with Known Working Video**

Visit `/test` and click "Load Test Video" to test with:
- **Video ID:** `dQw4w9WgXcQ` (Rick Astley - Never Gonna Give You Up)
- This video is official, embeddable, and always works

---

## 📊 **Debug Video Data**

The console will show detailed info about fetched videos:

```
=== Video Data Debug ===
Total videos: 5
YouTube videos: 5
Official videos: 3
Trailer videos: 2

--- All Videos ---
1. Official Trailer
   Site: YouTube
   Type: Trailer
   Official: true
   Key (Video ID): abc123xyz
   Valid ID: ✓
   Embed URL: https://www.youtube.com/embed/abc123xyz
   Watch URL: https://www.youtube.com/watch?v=abc123xyz
```

---

## 🛠️ **Troubleshooting**

### **Issue 1: Console shows "YouTube API not available"**

**Symptoms:**
- Player shows "Loading" indefinitely
- Console error: "YouTube API not available"

**Solutions:**
1. Check network connection
2. Check if `https://www.youtube.com/iframe_api` is blocked
3. Try incognito/private browsing mode
4. Check browser extensions (ad blockers may block YouTube)

### **Issue 2: Console shows Error 100**

**Symptoms:**
- Player shows error "Video not found"
- Console: `YouTube Player Error: 100`

**Solutions:**
1. Video ID is invalid - check the video ID format
2. Video has been removed from YouTube
3. Open the watch URL to verify: `https://www.youtube.com/watch?v=VIDEO_ID`

### **Issue 3: Console shows Error 101 or 150**

**Symptoms:**
- Player shows error "Embed not allowed" or "Embed forbidden"
- Console: `YouTube Player Error: 101` or `150`

**Solutions:**
1. Video owner has disabled embedding
2. Try a different video from the same movie
3. No workaround - must use different video or source

### **Issue 4: No videos found**

**Symptoms:**
- Console: `No videos available to select`
- Movie detail page shows no video player

**Solutions:**
1. Some movies don't have trailers on YouTube
2. TMDb might not have video data for this movie
3. Try a different movie (e.g., ID 550 = Fight Club)

---

## 🧪 **Test Page Usage**

Visit `/test` to debug video playback:

1. **Enter a video ID** - Test any YouTube video ID
2. **Load Test Video** - Test with a known working video
3. **Open on YouTube** - Verify video exists on YouTube
4. **Check validation** - See if video ID format is valid
5. **Watch console** - See detailed player state changes

---

## 📝 **Example Console Output (Working)**

```
=== Video Data Debug ===
Total videos: 8
YouTube videos: 8
Official videos: 4
Trailer videos: 3

Selected first video: Official Trailer (ID: dQw4w9WgXcQ)
Watch URL: https://www.youtube.com/watch?v=dQw4w9WgXcQ

VideoPlayer mounted, videoId: dQw4w9WgXcQ
Loading YouTube IFrame API...
YouTube IFrame API loaded
Initializing YouTube player for video: dQw4w9WgXcQ
YouTube player ready: {videoId: "dQw4w9WgXcQ", playerState: -1}
Player ready, getting duration...
Video duration: 212
Seeking to start time: 0
State change: {state: 1, stateName: "playing", currentTime: 0.5}
```

---

## 📝 **Example Console Output (Error)**

```
=== Video Data Debug ===
Total videos: 0

No videos found for this movie
No videos available to select

VideoPlayer mounted, videoId: undefined
Initializing YouTube player for video: undefined
YouTube player error: 100
Error: Video not found
```

---

## 🔧 **Useful Utility Functions**

```typescript
import {
  isValidYouTubeVideoId,
  getYouTubeWatchUrl,
  getYouTubeEmbedUrl,
  debugVideoData,
  getTestVideoId,
} from "@/utils";

// Validate video ID
const isValid = isValidYouTubeVideoId("dQw4w9WgXcQ"); // true

// Get watch URL
const watchUrl = getYouTubeWatchUrl("dQw4w9WgXcQ");
// https://www.youtube.com/watch?v=dQw4w9WgXcQ

// Get embed URL
const embedUrl = getYouTubeEmbedUrl("dQw4w9WgXcQ", 10);
// https://www.youtube.com/embed/dQw4w9WgXcQ?start=10&...

// Debug video data
debugVideoData(videos);

// Get test video ID
const testId = getTestVideoId(); // "dQw4w9WgXcQ"
```

---

## 📞 **Next Steps**

1. **Visit `/test`** page and test with the default video
2. **Check browser console** for messages
3. **Try different video IDs** to see which work
4. **Check TMDb response** to see what video IDs are being returned
5. **Report specific errors** based on console messages

---

## 🎯 **Common Video IDs for Testing**

| Movie | ID | Video ID |
|-------|----|----------|
| Rick Roll | N/A | `dQw4w9WgXcQ` |
| Big Buck Bunny | N/A | `aqz-KE-bpKQ` |
| Sintel (Blender) | N/A | `eRsGyueVLvQ` |
| Fight Club | 550 | Check TMDb |
| Interstellar | 157336 | Check TMDb |
| The Dark Knight | 155 | Check TMDb |

---

## 💡 **Tips**

1. **Always check console first** - The answers are usually there
2. **Test with known good video** - Confirm player works before debugging TMDb
3. **Watch URL verification** - If it plays on YouTube, the video exists
4. **Error codes mean something** - 100, 101, 150 all have specific meanings
5. **TMDb data varies** - Not all movies have videos on YouTube
