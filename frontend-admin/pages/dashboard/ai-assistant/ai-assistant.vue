<script setup>
import { ref } from "vue";

definePageMeta({
  layout: "dashboard",
});

const question = ref("");
const answer = ref("");
const loading = ref(false);
const error = ref("");

const suggestedQuestions = [
  "Why was I marked late yesterday?",
  "How many late arrivals do I have?",
  "Show my attendance for June.",
  "Do I have any missing checkouts?",
];

const askQuestion = async () => {
  if (!question.value.trim() || loading.value) {
    return;
  }

  loading.value = true;
  answer.value = "";
  error.value = "";

  try {
    // Temporary API call.
    // We will move this into ai-assistant.service.js
    // once the backend endpoint is ready.
    const response = await $fetch(
      "http://localhost:5000/api/ai-assistant/ask",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: {
          question: question.value.trim(),
        },
      }
    );

    answer.value = response?.data?.answer || "No answer was returned.";
  } catch (err) {
    console.error("AI Assistant error:", err);

    error.value =
      err?.data?.message ||
      "Unable to get an answer right now. Please try again.";
  } finally {
    loading.value = false;
  }
};

const useSuggestedQuestion = (suggestion) => {
  question.value = suggestion;
  answer.value = "";
  error.value = "";
};
</script>

<template>
  <div class="ai-assistant-page">
    <div class="page-header">
      <div>
        <div class="title-row">
          <span class="title-icon">
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 3a7 7 0 0 0-7 7v4a3 3 0 0 0 3 3h1" />
              <path d="M12 3a7 7 0 0 1 7 7v4a3 3 0 0 1-3 3h-1" />
              <path d="M8 17v1a4 4 0 0 0 8 0v-1" />
              <path d="M9 11h.01M15 11h.01" />
              <path d="M9 14c1.8 1.2 4.2 1.2 6 0" />
            </svg>
          </span>

          <h1>AI Assistant</h1>
        </div>

        <p>
          Ask questions about your attendance and get quick answers.
        </p>
      </div>
    </div>

    <div class="assistant-card">
      <div class="assistant-intro">
        <div class="assistant-avatar">
          <svg
            viewBox="0 0 24 24"
            width="28"
            height="28"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 3a7 7 0 0 0-7 7v4a3 3 0 0 0 3 3h1" />
            <path d="M12 3a7 7 0 0 1 7 7v4a3 3 0 0 1-3 3h-1" />
            <path d="M8 17v1a4 4 0 0 0 8 0v-1" />
            <circle cx="9" cy="11" r=".5" fill="currentColor" />
            <circle cx="15" cy="11" r=".5" fill="currentColor" />
          </svg>
        </div>

        <div>
          <h2>Ask about your attendance</h2>
          <p>
            I can help you understand your attendance records and
            answer questions about your check-ins, check-outs and
            late arrivals.
          </p>
        </div>
      </div>

      <div class="suggested-section">
        <span class="section-label">Try asking</span>

        <div class="suggested-questions">
          <button
            v-for="suggestion in suggestedQuestions"
            :key="suggestion"
            type="button"
            class="suggestion-button"
            @click="useSuggestedQuestion(suggestion)"
          >
            {{ suggestion }}
          </button>
        </div>
      </div>

      <form class="question-form" @submit.prevent="askQuestion">
        <label for="attendance-question">
          Your question
        </label>

        <div class="input-wrapper">
          <textarea
            id="attendance-question"
            v-model="question"
            rows="3"
            placeholder="Ask something about your attendance..."
            :disabled="loading"
            @keydown.enter.exact.prevent="askQuestion"
          ></textarea>

          <button
            type="submit"
            class="ask-button"
            :disabled="!question.trim() || loading"
          >
            <svg
              v-if="!loading"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>

            <span v-if="loading" class="spinner"></span>

            {{ loading ? "Thinking..." : "Ask Assistant" }}
          </button>
        </div>
      </form>

      <div v-if="error" class="error-message">
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
        </svg>

        <span>{{ error }}</span>
      </div>

      <div v-if="answer" class="answer-section">
        <div class="answer-header">
          <span class="answer-icon">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 3a7 7 0 0 0-7 7v4a3 3 0 0 0 3 3h1" />
              <path d="M12 3a7 7 0 0 1 7 7v4a3 3 0 0 1-3 3h-1" />
              <path d="M8 17v1a4 4 0 0 0 8 0v-1" />
            </svg>
          </span>

          <span>AI Assistant</span>
        </div>

        <div class="answer-content">
          {{ answer }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ai-assistant-page {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 28px;
}

.page-header {
  margin-bottom: 24px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 11px;
}

.title-icon {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: #eef2ff;
  color: #4f46e5;
}

.page-header h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: #111827;
}

.page-header p {
  margin: 8px 0 0 53px;
  color: #6b7280;
  font-size: 14px;
}

.assistant-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  padding: 28px;
  box-shadow: 0 4px 18px rgba(15, 23, 42, 0.05);
}

.assistant-intro {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding-bottom: 24px;
  border-bottom: 1px solid #eef0f3;
}

.assistant-avatar {
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: #eef2ff;
  color: #4f46e5;
}

.assistant-intro h2 {
  margin: 2px 0 5px;
  font-size: 18px;
  font-weight: 650;
  color: #111827;
}

.assistant-intro p {
  margin: 0;
  max-width: 700px;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.6;
}

.suggested-section {
  padding: 22px 0;
}

.section-label {
  display: block;
  margin-bottom: 10px;
  color: #6b7280;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.suggested-questions {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
}

.suggestion-button {
  padding: 9px 13px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #f9fafb;
  color: #374151;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.suggestion-button:hover {
  border-color: #c7d2fe;
  background: #eef2ff;
  color: #4338ca;
}

.question-form label {
  display: block;
  margin-bottom: 8px;
  color: #374151;
  font-size: 14px;
  font-weight: 600;
}

.input-wrapper {
  position: relative;
}

textarea {
  width: 100%;
  min-height: 115px;
  padding: 14px 155px 55px 15px;
  resize: vertical;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  outline: none;
  color: #111827;
  background: #ffffff;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

textarea:focus {
  border-color: #818cf8;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

textarea:disabled {
  background: #f9fafb;
  cursor: not-allowed;
}

.ask-button {
  position: absolute;
  right: 10px;
  bottom: 10px;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 15px;
  border: 0;
  border-radius: 9px;
  background: #4f46e5;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, opacity 0.2s;
}

.ask-button:hover:not(:disabled) {
  background: #4338ca;
}

.ask-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  width: 15px;
  height: 15px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 18px;
  padding: 12px 14px;
  border: 1px solid #fecaca;
  border-radius: 10px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 13px;
}

.answer-section {
  margin-top: 24px;
  padding: 20px;
  border: 1px solid #e0e7ff;
  border-radius: 13px;
  background: #f8faff;
}

.answer-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #4338ca;
  font-size: 13px;
  font-weight: 700;
}

.answer-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.answer-content {
  color: #374151;
  font-size: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .ai-assistant-page {
    padding: 18px;
  }

  .assistant-card {
    padding: 20px;
  }

  .page-header p {
    margin-left: 0;
  }

  .suggested-questions {
    flex-direction: column;
  }

  .suggestion-button {
    text-align: left;
  }

  textarea {
    padding-right: 15px;
    padding-bottom: 60px;
  }
}
</style>