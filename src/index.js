
// JS - ./js/index.js
import './js/'
// SCSS
import './scss/main.scss'
// CSS (example)
import './css/main.css'

// Vue
import Vue from 'vue'
import store from './store'

// Components
Vue.component('photo-editor', require('./components/PhotoEditor.vue').default)

const app = new Vue({
  store,
  el: '#app'
})
