from pathlib import Path
import argparse,subprocess
p=argparse.ArgumentParser();p.add_argument('--ffmpeg',default='ffmpeg');p.add_argument('--raw',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
a.output.parent.mkdir(parents=True,exist_ok=True)
subprocess.run([a.ffmpeg,'-hide_banner','-y','-i',str(a.raw/'main-demo.webm'),'-vf','fps=30,scale=1920:1080,setsar=1,tpad=stop_mode=clone:stop_duration=1,trim=start=2,setpts=PTS-STARTPTS,fade=t=out:st=59.3:d=0.7','-frames:v','1800','-c:v','libx264','-preset','medium','-crf','20','-threads','4','-pix_fmt','yuv420p','-an','-movflags','+faststart',str(a.output)],check=True)
subprocess.run([a.ffmpeg,'-v','error','-i',str(a.output),'-f','null','-'],check=True)
