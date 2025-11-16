import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

import example from './example'
import photoEditor from './photoEditor'

export default new Vuex.Store({
  modules: {
    example,
    photoEditor
  }
})