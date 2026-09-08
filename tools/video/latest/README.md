# Latest-main video reproduction

The completed MP4 is linked from the repository README. This directory preserves the actual camera, mission, capture and encoding code used to create it.

Source: integrated main commit `f912d07d5307ccbe13f1fd3f61273eeb63d46dfa`.
Only filming hooks and an upload middleware are added to an isolated checkout; production physics, models, mission builders and rendering settings remain unchanged. One box completes inbound and outbound for shelf056. The capture rejects nonempty initial data and validates both missions and box counts.

For future reproduction, install Node.js, Python 3 and Chrome, then run `npm install` and `npm run produce` in this directory. The recorder installs the application dependencies, creates a disposable SQLite database, records the real WebGL canvas and emits `.video-production/warehouse-latest-demo.mp4`. Set `CHROME_PATH` or `FFMPEG` if needed. The output is 62 seconds, 1920×1080, 30 fps H.264 with no audio. Real-time physics timing can vary by hardware. Servers stop after recording.
