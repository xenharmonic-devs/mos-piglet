<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'
import { useAudioStore } from './stores/audio'
import { onMounted, onUnmounted } from 'vue'

const audio = useAudioStore()

function mtof(i: number) {
  return 440 * 2 ** ((i - 69) / 12)
}

function makeSound(index: number) {
  if (!audio.synth) {
    return
  }
  audio.synth.noteOn(mtof(index), 0.69)
}

function onMouseup() {
  if (!audio.synth) {
    return
  }
  audio.synth.allNotesOff()
}

onMounted(() => {
  window.addEventListener('mousedown', audio.initialize)
  window.addEventListener('mouseup', onMouseup)
})

onUnmounted(() => {
  window.removeEventListener('mousedown', audio.initialize)
  window.removeEventListener('mouseup', onMouseup)
  audio.unintialize()
})
</script>

<template>
  <header>
    <img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="125" height="125" />

    <div class="wrapper">
      <HelloWorld msg="You did it!" />
      <button @mousedown="makeSound(60)">C</button>
      <button @mousedown="makeSound(62)">D</button>
      <button @mousedown="makeSound(64)">E</button>
      <button @mousedown="makeSound(65)">F</button>
      <button @mousedown="makeSound(67)">G</button>
      <button @mousedown="makeSound(69)"><!--nice-->A</button>
      <button @mousedown="makeSound(71)">B</button>
      <button @mousedown="makeSound(72)">C</button>

      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav>
    </div>
  </header>

  <RouterView />
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>
