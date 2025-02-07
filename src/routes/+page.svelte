<script>
import {onMount} from 'svelte'

export const ssr = false
onMount(async () => {

const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
const audioContext = new AudioContext();
const mediaStreamAudioSourceNode = audioContext.createMediaStreamSource(stream);
const analyserNode = audioContext.createAnalyser();
mediaStreamAudioSourceNode.connect(analyserNode);

const pcmData = new Float32Array(analyserNode.fftSize);

// do sounds

const onFrame = () => {
   
    document.getElementById("val").innerHTML = document.getElementById("myRange").value
    analyserNode.getFloatTimeDomainData(pcmData);
    let sumSquares = 0.0;
    for (const amplitude of pcmData) { sumSquares += amplitude*amplitude; }
    const volume = Math.sqrt(sumSquares / pcmData.length);
    console.log(volume)
    console.log("Threshold: " + document.getElementById("myRange").value * 0.04)
    if (volume >= document.getElementById("myRange").value * 0.004) {
	document.getElementById("awake").style.display = "block"
	document.getElementById("asleep").style.display = "none"
	console.log("oops the cat is awake")
	setTimeout(() => {
		document.getElementById("awake").style.display = "none"
		document.getElementById("asleep").style.display = "block"
		//make meow tbd

		});
		
	}, 5000)
    }
    window.requestAnimationFrame(onFrame);
};
setInterval(onFrame, 100)

})

</script>


Don't talk in order to keep the cats asleep!
<br>
Volume threshold (default is 25)

<input type="range" min="1" max="100" value="25" class="slider" id="myRange">
<p id="val">25</p>
<img src="https://images.saymedia-content.com/.image/t_share/MTc0Mjg1ODg4NjEwNjQxNzg4/small-exotic-cats.jpg" id="awake"/>
<img src="https://images.rawpixel.com/image_png_social_landscape/cHJpdmF0ZS9zdGF0aWMvZmlsZXMvd2Vic2l0ZS8yMDIzLTAyL3BkbWlzYzgtZm5nMzA1NjU3Yi1pbWFnZS5wbmc.png" id="asleep"/>

<style>
#awake {
	display: none;
}
</style>
