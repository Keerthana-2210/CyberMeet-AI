Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer

# Audio 1: Insider Threat
$synth.SetOutputToWaveFile("c:\Users\laksh\OneDrive\Documents\minor project\CyberMeet-AI\insider_threat.wav")
$synth.Speak("Hi everyone. During our routine check, we noticed some suspicious activity from the internal network. It seems someone has been trying to bypass the firewall and transfer a massive amount of customer data to an external USB drive. We need to lock the account down immediately and investigate.")

# Audio 2: Ransomware Attack
$synth.SetOutputToWaveFile("c:\Users\laksh\OneDrive\Documents\minor project\CyberMeet-AI\ransomware_attack.wav")
$synth.Speak("Emergency meeting. Multiple servers have suddenly gone offline. We just received a message that the files have been encrypted by ransomware. They are demanding a transfer of funds to unlock the network. Everyone needs to disconnect their machines from the Wi-Fi immediately to prevent further spread.")

$synth.Dispose()
