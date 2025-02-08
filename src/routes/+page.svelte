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
<img src="https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/78d89d89-9029-4e4c-a587-6cd2c270631c/d7hcigh-1c33f2a8-b8e8-431b-841a-9ac9543913bd.gif?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwic3ViIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsImF1ZCI6WyJ1cm46c2VydmljZTpmaWxlLmRvd25sb2FkIl0sIm9iaiI6W1t7InBhdGgiOiIvZi83OGQ4OWQ4OS05MDI5LTRlNGMtYTU4Ny02Y2QyYzI3MDYzMWMvZDdoY2lnaC0xYzMzZjJhOC1iOGU4LTQzMWItODQxYS05YWM5NTQzOTEzYmQuZ2lmIn1dXX0.aGufalnylEW1hqKHk7H1n2kikKdiqcuZEb8h8wegXK8" id="asleep"/>

<style>
#awake {
	display: none;
}
</style>
