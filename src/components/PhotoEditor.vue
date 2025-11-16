<template>
  <div class="photo-editor">
    <div class="photo-editor__header">
      <h1 class="photo-editor__title">AI Фоторедактор</h1>
      <p class="photo-editor__subtitle">Редагуйте зображення за допомогою штучного інтелекту</p>
    </div>

    <!-- API Key Input -->
    <div class="photo-editor__api-key" v-if="!apiKey">
      <div class="api-key-prompt">
        <h2>Налаштування</h2>
        <p>Введіть ваш API ключ Gemini для початку роботи</p>
        <div class="input-group">
          <input
            type="password"
            v-model="apiKeyInput"
            placeholder="Введіть API ключ..."
            class="input-field"
            @keyup.enter="saveApiKey"
          />
          <button @click="saveApiKey" class="btn btn-primary">Зберегти</button>
        </div>
        <p class="help-text">
          Отримайте ключ на
          <a href="https://ai.google.dev/" target="_blank">Google AI Studio</a>
        </p>
      </div>
    </div>

    <!-- Main Editor -->
    <div class="photo-editor__main" v-else>
      <!-- Sidebar Controls -->
      <div class="photo-editor__sidebar">
        <div class="control-section">
          <h3>API Ключ</h3>
          <button @click="changeApiKey" class="btn btn-small">Змінити ключ</button>
        </div>

        <!-- Upload Section -->
        <div class="control-section">
          <h3>Завантажити фото</h3>
          <div class="upload-area" @click="triggerFileInput">
            <input
              type="file"
              ref="fileInput"
              @change="handleFileUpload"
              accept="image/*"
              style="display: none"
            />
            <div class="upload-icon">📁</div>
            <p>Натисніть для вибору файлу</p>
            <p class="help-text">PNG, JPG, WEBP</p>
          </div>
        </div>

        <!-- Prompt Section -->
        <div class="control-section" v-if="hasImage">
          <h3>Опис обробки</h3>
          <textarea
            v-model="currentPrompt"
            placeholder="Опишіть, що ви хочете зробити з фото..."
            class="prompt-input"
            rows="4"
          ></textarea>

          <button
            @click="processImage"
            :disabled="!canProcess || isProcessing"
            class="btn btn-primary btn-full"
          >
            {{ isProcessing ? 'Обробка...' : 'Обробити зображення' }}
          </button>

          <button
            @click="resetEditor"
            class="btn btn-secondary btn-full"
            :disabled="isProcessing"
          >
            Скинути
          </button>
        </div>

        <!-- Error Display -->
        <div class="error-message" v-if="error">
          <strong>Помилка:</strong> {{ error }}
        </div>
      </div>

      <!-- Image Display Area -->
      <div class="photo-editor__canvas">
        <div class="canvas-container" v-if="hasImage">
          <div class="image-wrapper">
            <img :src="currentImage" alt="Preview" class="preview-image" />
            <div class="image-label">
              {{ processedImage ? 'Оброблене зображення' : 'Оригінальне зображення' }}
            </div>
          </div>

          <!-- Download Button -->
          <div class="canvas-actions" v-if="processedImage">
            <button @click="downloadImage" class="btn btn-primary">
              Завантажити результат
            </button>
          </div>
        </div>

        <div class="canvas-empty" v-else>
          <div class="empty-state">
            <div class="empty-icon">🖼️</div>
            <h2>Завантажте фото для початку</h2>
            <p>Виберіть зображення у бічній панелі</p>
          </div>
        </div>

        <!-- Processing Overlay -->
        <div class="processing-overlay" v-if="isProcessing">
          <div class="spinner"></div>
          <p>Обробка зображення...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'

export default {
  name: 'PhotoEditor',

  data() {
    return {
      apiKeyInput: '',
      currentPrompt: ''
    }
  },

  computed: {
    ...mapState('photoEditor', [
      'uploadedImage',
      'imagePreview',
      'isProcessing',
      'processedImage',
      'apiKey',
      'prompt',
      'error'
    ]),

    ...mapGetters('photoEditor', [
      'hasImage',
      'canProcess',
      'currentImage'
    ])
  },

  methods: {
    ...mapActions('photoEditor', [
      'uploadImage',
      'processImage',
      'setApiKey',
      'setPrompt',
      'resetEditor'
    ]),

    saveApiKey() {
      if (this.apiKeyInput.trim()) {
        this.setApiKey(this.apiKeyInput.trim())
        this.apiKeyInput = ''
      }
    },

    changeApiKey() {
      if (confirm('Ви впевнені, що хочете змінити API ключ?')) {
        this.setApiKey('')
      }
    },

    triggerFileInput() {
      this.$refs.fileInput.click()
    },

    async handleFileUpload(event) {
      const file = event.target.files[0]
      if (file) {
        try {
          await this.uploadImage(file)
        } catch (error) {
          console.error('Upload error:', error)
        }
      }
      // Reset input
      event.target.value = ''
    },

    async processImage() {
      try {
        await this.$store.dispatch('photoEditor/processImage', {
          prompt: this.currentPrompt,
          apiKey: this.apiKey
        })
      } catch (error) {
        console.error('Processing error:', error)
      }
    },

    downloadImage() {
      if (this.processedImage) {
        const link = document.createElement('a')
        link.href = this.processedImage
        link.download = `edited-image-${Date.now()}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    }
  },

  watch: {
    currentPrompt(val) {
      this.setPrompt(val)
    }
  }
}
</script>

<style scoped lang="scss">
.photo-editor {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;

  &__header {
    text-align: center;
    color: white;
    margin-bottom: 30px;
  }

  &__title {
    font-size: 2.5rem;
    margin-bottom: 10px;
    font-weight: 700;
  }

  &__subtitle {
    font-size: 1.1rem;
    opacity: 0.9;
  }

  &__api-key {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 60vh;
  }

  &__main {
    display: grid;
    grid-template-columns: 350px 1fr;
    gap: 20px;
    max-width: 1400px;
    margin: 0 auto;
  }

  &__sidebar {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    height: fit-content;
  }

  &__canvas {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    min-height: 500px;
    position: relative;
  }
}

.api-key-prompt {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;

  h2 {
    margin-bottom: 10px;
    color: #333;
  }

  p {
    color: #666;
    margin-bottom: 20px;
  }
}

.control-section {
  margin-bottom: 25px;
  padding-bottom: 25px;
  border-bottom: 1px solid #eee;

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }

  h3 {
    font-size: 1rem;
    margin-bottom: 15px;
    color: #333;
    font-weight: 600;
  }
}

.upload-area {
  border: 2px dashed #667eea;
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: #764ba2;
    background: #f8f9ff;
  }

  .upload-icon {
    font-size: 3rem;
    margin-bottom: 10px;
  }

  p {
    margin: 5px 0;
    color: #666;
  }
}

.input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.input-field {
  flex: 1;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
}

.prompt-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  margin-bottom: 15px;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }
  }

  &-secondary {
    background: #f0f0f0;
    color: #333;

    &:hover:not(:disabled) {
      background: #e0e0e0;
    }
  }

  &-small {
    padding: 8px 16px;
    font-size: 0.9rem;
  }

  &-full {
    width: 100%;
    margin-bottom: 10px;
  }
}

.canvas-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.image-wrapper {
  position: relative;
  max-width: 100%;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
}

.preview-image {
  max-width: 100%;
  max-height: 70vh;
  display: block;
  object-fit: contain;
}

.image-label {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
}

.canvas-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 500px;
}

.empty-state {
  text-align: center;
  color: #999;

  .empty-icon {
    font-size: 5rem;
    margin-bottom: 20px;
    opacity: 0.5;
  }

  h2 {
    color: #666;
    margin-bottom: 10px;
  }

  p {
    color: #999;
  }
}

.processing-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 12px;

  p {
    margin-top: 20px;
    font-size: 1.1rem;
    color: #667eea;
    font-weight: 600;
  }
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  background: #fee;
  border: 1px solid #fcc;
  color: #c33;
  padding: 15px;
  border-radius: 8px;
  font-size: 0.9rem;

  strong {
    display: block;
    margin-bottom: 5px;
  }
}

.help-text {
  font-size: 0.85rem;
  color: #999;

  a {
    color: #667eea;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

.canvas-actions {
  display: flex;
  gap: 10px;
}

@media (max-width: 768px) {
  .photo-editor__main {
    grid-template-columns: 1fr;
  }

  .photo-editor__title {
    font-size: 1.8rem;
  }
}
</style>
