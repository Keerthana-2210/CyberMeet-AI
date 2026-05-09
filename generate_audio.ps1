Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SetOutputToWaveFile("c:\Users\laksh\OneDrive\Documents\minor project\CyberMeet-AI\threat_meeting.wav")
$synth.Speak("Hey team, we need to discuss an urgent security issue. It looks like someone gained unauthorized access to the main database server. The logs show they used a phishing email to steal an admin password. We need immediate action to verify our identity protocols and make sure no credit card details were exposed.")
$synth.Dispose()
