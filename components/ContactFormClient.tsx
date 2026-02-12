"use client"
import { useState, useEffect, useRef } from "react";
import { SelectOption } from "@/types";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "./ui/card";
import { ButtonGroup } from "./ui/button-group";
import { Button } from "./ui/button";
import { Send } from "lucide-react";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "./ui/field";
import { Textarea } from "./ui/textarea";
import { Spinner } from "./ui/spinner";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { cn } from "@/lib/utils";
import { UploadDropzone } from "./ui/upload-dropzone";
import { UploadProgress } from "./ui/upload-progress";
import { useUploadFiles } from "@better-upload/client";


const selectOptions: SelectOption[] = [
  { label: "Ho un'idea per la dashboard", memberId: "1" },
  { label: "Ho un'idea per il sito", memberId: "2" },
  { label: "Ho un'idea per l'app", memberId: "3" },
  { label: "Altro", memberId: "other" },
];

const MESSAGE_MAX_LENGTH = 1000;
const maxFiles = 4;

export default function ContactFormClient() {

  const [selectedOption, setSelectedOption] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [shakeKey, setShakeKey] = useState(0);
  const [counterShakeKey, setCounterShakeKey] = useState(0);
  const [removedFileKeys, setRemovedFileKeys] = useState<Set<string>>(new Set());
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const { control } = useUploadFiles({
    route: 'images',
  });

  const invalid = selectedOption === "" || message.length === 0;
  const messageInvalid = message.length === 0;
  const atMaxLength = message.length >= MESSAGE_MAX_LENGTH;

  useEffect(() => {
    if (shakeKey === 0) return;
    const t = setTimeout(() => setShakeKey(0), 500);
    return () => clearTimeout(t);
  }, [shakeKey]);

  const counterShakeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isCharacterKey = (e: React.KeyboardEvent) => {
    const editingKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Tab", "Enter", "Escape"];
    return (
      !editingKeys.includes(e.key) &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey
    );
  };

  const handleMessageKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (atMaxLength && isCharacterKey(e)) {
      setCounterShakeKey((k) => k + 1);
      if (counterShakeTimeoutRef.current) clearTimeout(counterShakeTimeoutRef.current);
      counterShakeTimeoutRef.current = setTimeout(() => setCounterShakeKey(0), 500);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (invalid) {
      setShakeKey((k) => k + 1);
      return;
    }
    setLoading(true);
    try {
      let uploadedFiles: { name: string; key: string }[] = [];
      if (pendingFiles.length > 0) {
        const result = await control.upload(pendingFiles);
        if (result.failedFiles?.length) {
          toast.error("Alcuni file non sono stati caricati");
          setLoading(false);
          return;
        }
        uploadedFiles = (result.files ?? []).map((f) => ({
          name: f.name,
          key: f.objectInfo.key,
        }));
      }
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: selectedOption,
          message,
          files: uploadedFiles,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Invio fallito");
        setLoading(false);
        return;
      }
      toast.success("Messaggio inviato");
      setMessage("");
      setSelectedOption("");
      setPendingFiles([]);
      setRemovedFileKeys(new Set());
      control.reset();
    } catch {
      toast.error("Errore di connessione");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Card className="flex flex-col gap-4 w-[95%] mx-auto mt-10">
      {/* Header with title*/}
      <CardHeader>
        <CardTitle>Su cosa vuoi lasciare un feedback?</CardTitle>
      </CardHeader>

      {/* Content with select and form*/}
      <CardContent>
        <Select value={selectedOption} onValueChange={setSelectedOption} aria-label="Seleziona il problema">
          <SelectTrigger className="h-12 text-base w-[300px]" id='contact-select' aria-label="Seleziona il problema">
            <SelectValue placeholder="Scegli un'opzione" />
          </SelectTrigger>
          <SelectContent position="popper" align="center" className="bg-popover border border-border z-50">
            {selectOptions.map((opt) => (
              <SelectItem key={opt.label} value={opt.label}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>


        <form id="contact-form" className="flex flex-col mt-10" onSubmit={handleSubmit}>
          <FieldGroup>
            <FieldSet>
              <FieldLegend variant="legend" className="text-2xl font-bold">Scrivi un messaggio</FieldLegend>
              <FieldDescription>
                Ogni messaggio è letto attentamente dal membro del team più adatto alla scelta che hai fatto e risponderemo il prima possibile.
              </FieldDescription>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="message">Cosa vuoi condividere?</FieldLabel>
                  <FieldContent>
                    <Textarea
                      aria-label="Messaggio"
                      aria-required="true"
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={handleMessageKeyDown}
                      required
                      name="message"
                      placeholder="Scrivi un messaggio"
                      className={cn(
                        "resize-none h-[150px]",
                        shakeKey > 0 && invalid && "animate-shake"
                      )}
                      maxLength={MESSAGE_MAX_LENGTH}
                      aria-invalid={messageInvalid}
                      aria-describedby="message-counter"
                    />
                    <p
                      key={counterShakeKey || "idle"}
                      id="message-counter"
                      className={cn(
                        "text-sm inline-block",
                        (messageInvalid || counterShakeKey > 0 || atMaxLength) ? "text-destructive" : "text-muted-foreground",
                        counterShakeKey > 0 && "animate-shake"
                      )}
                    >
                      {message.length} / {MESSAGE_MAX_LENGTH}
                    </p>
                  </FieldContent>
                </Field>
              </FieldGroup>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="files">Allega un file</FieldLabel>
                  <FieldContent>
                    <div className="w-md mx-auto flex flex-col gap-4">
                      <UploadDropzone
                        aria-label="Allega un file"
                        aria-required="true"
                        id="files"
                        control={control}
                        accept="image/*,video/*"
                        description={{
                          maxFiles: maxFiles,
                          fileTypes: 'JPEG, PNG, JPG, MOV, MP4, WEBP',
                        }}
                        uploadOverride={(files) => {
                          setPendingFiles((prev) =>
                            [...prev, ...Array.from(files)].slice(0, maxFiles)
                          );
                        }}
                      />
                      {pendingFiles.length > 0 && !loading && (
                        <div className="grid gap-2">
                          <p className="text-muted-foreground text-xs">
                            Verranno caricati all&apos;invio del messaggio
                          </p>
                          {pendingFiles.map((file, index) => (
                            <UploadProgress
                              key={`pending-${index}-${file.name}-${file.size}`}
                              pendingFile={{
                                name: file.name,
                                size: file.size,
                                key: `pending-${index}`,
                              }}
                              onRemoveFile={(key) => {
                                const i = parseInt(
                                  key.replace("pending-", ""),
                                  10
                                );
                                setPendingFiles((prev) =>
                                  prev.filter((_, idx) => idx !== i)
                                );
                              }}
                            />
                          ))}
                        </div>
                      )}
                      {control.progresses
                        .filter((p) => !removedFileKeys.has(p.objectInfo.key))
                        .map((p) => (
                          <UploadProgress
                            key={p.objectInfo.key}
                            control={control}
                            progress={p}
                            onRemoveFile={(key) =>
                              setRemovedFileKeys((prev) =>
                                new Set(prev).add(key)
                              )
                            }
                          />
                        ))}
                    </div>
                  </FieldContent>
                </Field>
              </FieldGroup>
            </FieldSet>
          </FieldGroup>
        </form>

      </CardContent>

      {/* Footer with buttons*/}
      <CardFooter>
        <ButtonGroup orientation="horizontal" className="flex flex-row gap-4 w-full justify-end">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Button
                  type="submit"
                  form="contact-form"
                  variant="default"
                  className="group"
                  disabled={loading || invalid}
                >
                  {loading ? <Spinner /> : (
                    <>
                      <Send className="size-4" />
                      Invia
                    </>
                  )}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{invalid ? "Compila tutti i campi per inviare" : "Invia il messaggio"}</p>
            </TooltipContent>
          </Tooltip>
        </ButtonGroup>
      </CardFooter>
    </Card>
  )
}