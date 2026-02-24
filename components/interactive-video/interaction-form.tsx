"use client"

import { useState, useCallback } from "react"
import { X, Plus, Trash2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Interaction, InteractionType, Option } from "@/lib/interactive-video-types"

interface InteractionFormProps {
  type: InteractionType
  timestamp: number
  existingInteraction?: Interaction | null
  onSave: (interaction: Interaction) => void
  onCancel: () => void
}

function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

const TYPE_LABELS: Record<InteractionType, string> = {
  "multiple-choice": "Coktan Secmeli Soru",
  "true-false": "Dogru/Yanlis Sorusu",
  "info-note": "Bilgi Notu",
}

export function InteractionForm({
  type,
  timestamp,
  existingInteraction,
  onSave,
  onCancel,
}: InteractionFormProps) {
  const [question, setQuestion] = useState(existingInteraction?.question || "")
  const [explanation, setExplanation] = useState(existingInteraction?.explanation || "")
  const [options, setOptions] = useState<Option[]>(
    existingInteraction?.options ||
      (type === "multiple-choice"
        ? [
            { id: generateId(), text: "", isCorrect: false },
            { id: generateId(), text: "", isCorrect: false },
            { id: generateId(), text: "", isCorrect: false },
            { id: generateId(), text: "", isCorrect: false },
          ]
        : type === "true-false"
          ? [
              { id: generateId(), text: "Dogru", isCorrect: true },
              { id: generateId(), text: "Yanlis", isCorrect: false },
            ]
          : [])
  )

  const handleOptionTextChange = useCallback((optionId: string, text: string) => {
    setOptions((prev) => prev.map((o) => (o.id === optionId ? { ...o, text } : o)))
  }, [])

  const handleCorrectToggle = useCallback((optionId: string) => {
    setOptions((prev) =>
      prev.map((o) => ({
        ...o,
        isCorrect: o.id === optionId,
      }))
    )
  }, [])

  const handleAddOption = useCallback(() => {
    setOptions((prev) => [...prev, { id: generateId(), text: "", isCorrect: false }])
  }, [])

  const handleRemoveOption = useCallback((optionId: string) => {
    setOptions((prev) => prev.filter((o) => o.id !== optionId))
  }, [])

  const handleSave = useCallback(() => {
    if (!question.trim()) return

    const interaction: Interaction = {
      id: existingInteraction?.id || generateId(),
      type,
      timestamp,
      question: question.trim(),
      options,
      explanation: explanation.trim(),
    }
    onSave(interaction)
  }, [question, explanation, options, type, timestamp, existingInteraction, onSave])

  const optionLabels = ["A", "B", "C", "D", "E", "F"]

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{TYPE_LABELS[type]}</h3>
          <p className="text-sm text-muted-foreground">Zaman: {formatTime(timestamp)}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
          <span className="sr-only">Kapat</span>
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {/* Question Text */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="question-text">
            {type === "info-note" ? "Bilgi Notu Metni" : "Soru Metni"}
          </Label>
          <Textarea
            id="question-text"
            placeholder={
              type === "info-note"
                ? "Bilgi notunu yazin..."
                : "Sorunuzu yazin..."
            }
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Options (not for info-note) */}
        {type !== "info-note" && (
          <div className="flex flex-col gap-3">
            <Label>Secenekler</Label>
            {options.map((option, index) => (
              <div key={option.id} className="flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary text-sm font-semibold text-secondary-foreground">
                  {optionLabels[index] || index + 1}
                </span>
                <Input
                  placeholder={`Secenek ${optionLabels[index] || index + 1}`}
                  value={option.text}
                  onChange={(e) => handleOptionTextChange(option.id, e.target.value)}
                  className="flex-1"
                  readOnly={type === "true-false"}
                />
                <Button
                  type="button"
                  variant={option.isCorrect ? "default" : "outline"}
                  size="icon"
                  onClick={() => handleCorrectToggle(option.id)}
                  className={`h-8 w-8 shrink-0 ${
                    option.isCorrect
                      ? "bg-success text-success-foreground hover:bg-success/90"
                      : ""
                  }`}
                  title="Dogru cevap olarak isaretle"
                >
                  <Check className="h-4 w-4" />
                  <span className="sr-only">Dogru cevap</span>
                </Button>
                {type === "multiple-choice" && options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveOption(option.id)}
                    className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Secenegi sil</span>
                  </Button>
                )}
              </div>
            ))}
            {type === "multiple-choice" && options.length < 6 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddOption}
                className="mt-1 w-fit"
              >
                <Plus className="mr-1 h-4 w-4" />
                Secenek Ekle
              </Button>
            )}
          </div>
        )}

        {/* Explanation */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="explanation">
            {type === "info-note" ? "Ek Aciklama (opsiyonel)" : "Aciklama (cevap sonrasi gosterilecek)"}
          </Label>
          <Textarea
            id="explanation"
            placeholder="Aciklamanizi yazin..."
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={2}
            className="resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onCancel}>
            Iptal
          </Button>
          <Button
            onClick={handleSave}
            disabled={!question.trim()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Kaydet
          </Button>
        </div>
      </div>
    </div>
  )
}
