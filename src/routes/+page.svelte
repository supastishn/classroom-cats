<script>
import {onMount} from 'svelte'
onMount(async () => {

const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
const audioContext = new AudioContext();
const mediaStreamAudioSourceNode = audioContext.createMediaStreamSource(stream);
const analyserNode = audioContext.createAnalyser();
mediaStreamAudioSourceNode.connect(analyserNode);

const pcmData = new Float32Array(analyserNode.fftSize);
const onFrame = () => {
    analyserNode.getFloatTimeDomainData(pcmData);
    let sumSquares = 0.0;
    for (const amplitude of pcmData) { sumSquares += amplitude*amplitude; }
    const volume = Math.sqrt(sumSquares / pcmData.length);
    console.log(volume)
    if (volume >= 0.1) {
	document.getElementById("awake").style.display = "block"
	document.getElementById("asleep").style.display = "none"
	console.log("oops the cat is awake")
	setTimeout(() => {
		document.getElementById("awake").style.display = "none"
		document.getElementById("asleep").style.display = "block"
	}, 5000)
    }
    window.requestAnimationFrame(onFrame);
};
setInterval(onFrame, 100)

})

</script>


Don't talk in order to keep the cats asleep!
<img src="https://images.saymedia-content.com/.image/t_share/MTc0Mjg1ODg4NjEwNjQxNzg4/small-exotic-cats.jpg" id="awake"/>
<img src="https://images.rawpixel.com/image_png_social_landscape/cHJpdmF0ZS9zdGF0aWMvZmlsZXMvd2Vic2l0ZS8yMDIzLTAyL3BkbWlzYzgtZm5nMzA1NjU3Yi1pbWFnZS5wbmc.png" id="asleep"/>

<style>
#awake {
	display: none;
}
</style>
