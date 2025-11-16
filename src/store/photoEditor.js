export default {
  namespaced: true,

  state: {
    uploadedImage: null,
    imagePreview: null,
    isProcessing: false,
    processedImage: null,
    apiKey: '',
    prompt: '',
    error: null
  },

  mutations: {
    SET_UPLOADED_IMAGE(state, image) {
      state.uploadedImage = image
    },

    SET_IMAGE_PREVIEW(state, preview) {
      state.imagePreview = preview
    },

    SET_PROCESSING(state, status) {
      state.isProcessing = status
    },

    SET_PROCESSED_IMAGE(state, image) {
      state.processedImage = image
    },

    SET_API_KEY(state, key) {
      state.apiKey = key
    },

    SET_PROMPT(state, prompt) {
      state.prompt = prompt
    },

    SET_ERROR(state, error) {
      state.error = error
    },

    CLEAR_ERROR(state) {
      state.error = null
    },

    RESET_STATE(state) {
      state.uploadedImage = null
      state.imagePreview = null
      state.processedImage = null
      state.prompt = ''
      state.error = null
    }
  },

  actions: {
    uploadImage({ commit }, file) {
      return new Promise((resolve, reject) => {
        if (!file) {
          reject('No file provided')
          return
        }

        const reader = new FileReader()

        reader.onload = (e) => {
          const imageData = e.target.result
          commit('SET_UPLOADED_IMAGE', file)
          commit('SET_IMAGE_PREVIEW', imageData)
          commit('CLEAR_ERROR')
          resolve(imageData)
        }

        reader.onerror = (error) => {
          commit('SET_ERROR', 'Error reading file')
          reject(error)
        }

        reader.readAsDataURL(file)
      })
    },

    async processImage({ state, commit }, { prompt, apiKey }) {
      commit('SET_PROCESSING', true)
      commit('CLEAR_ERROR')

      try {
        // Convert image to base64 if needed
        let imageBase64 = state.imagePreview
        if (imageBase64.includes('base64,')) {
          imageBase64 = imageBase64.split('base64,')[1]
        }

        // Gemini API endpoint for imagen
        const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict'

        const requestBody = {
          instances: [{
            prompt: prompt,
            image: {
              bytesBase64Encoded: imageBase64
            }
          }],
          parameters: {
            sampleCount: 1
          }
        }

        const response = await fetch(`${API_URL}?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error?.message || 'API request failed')
        }

        const data = await response.json()

        if (data.predictions && data.predictions[0]) {
          const processedImageBase64 = data.predictions[0].bytesBase64Encoded
          const processedImageUrl = `data:image/png;base64,${processedImageBase64}`
          commit('SET_PROCESSED_IMAGE', processedImageUrl)
        } else {
          throw new Error('No image generated')
        }

      } catch (error) {
        commit('SET_ERROR', error.message)
        throw error
      } finally {
        commit('SET_PROCESSING', false)
      }
    },

    setApiKey({ commit }, key) {
      commit('SET_API_KEY', key)
    },

    setPrompt({ commit }, prompt) {
      commit('SET_PROMPT', prompt)
    },

    resetEditor({ commit }) {
      commit('RESET_STATE')
    }
  },

  getters: {
    hasImage: state => !!state.imagePreview,
    canProcess: state => !!(state.imagePreview && state.apiKey && state.prompt),
    currentImage: state => state.processedImage || state.imagePreview
  }
}
