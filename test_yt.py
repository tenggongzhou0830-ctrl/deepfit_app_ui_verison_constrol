from pytubefix import YouTube

yt_default = YouTube("https://www.youtube.com/watch?v=TDNcxWJbpKU")
audio_default = yt_default.streams.get_audio_only()
print("DEFAULT:", audio_default.mime_type, audio_default.url[:50])

yt_web = YouTube("https://www.youtube.com/watch?v=TDNcxWJbpKU", client='WEB')
audio_web = yt_web.streams.get_audio_only()
print("WEB:", audio_web.mime_type, audio_web.url[:50])
