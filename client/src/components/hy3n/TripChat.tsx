import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { QUICK_REPLIES_DRIVER, QUICK_REPLIES_RIDER } from "@shared/hy3n";
import { Send, MessageCircle, Sparkles } from "lucide-react";

export function TripChat({ tripId, senderRole }: { tripId: number; senderRole: "driver" | "rider" }) {
  const [body, setBody] = useState("");
  const listEnd = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const list = trpc.messages.list.useQuery({ tripId }, { refetchInterval: 5000 });
  const send = trpc.messages.send.useMutation({
    onMutate: async (vars) => {
      await utils.messages.list.cancel({ tripId });
      const previous = utils.messages.list.getData({ tripId });
      utils.messages.list.setData({ tripId }, (old) => ([
        ...(old ?? []),
        { id: Date.now(), tripId, senderUserId: -1, senderRole: vars.senderRole, body: vars.body, isQuickReply: vars.isQuickReply ?? false, createdAt: new Date() } as any,
      ]));
      return { previous };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.previous) utils.messages.list.setData({ tripId }, ctx.previous);
      toast.error(e.message);
    },
    onSettled: () => utils.messages.list.invalidate({ tripId }),
  });

  useEffect(() => {
    listEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [list.data?.length]);

  const quick = senderRole === "driver" ? QUICK_REPLIES_DRIVER : QUICK_REPLIES_RIDER;

  function submit(text: string, isQuick = false) {
    if (!text.trim()) return;
    send.mutate({ tripId, body: text.trim(), isQuickReply: isQuick, senderRole });
    if (!isQuick) setBody("");
  }

  return (
    <div className="flex flex-col rounded-2xl border border-border/60 bg-card elegant-shadow overflow-hidden">
      <div className="px-4 py-3 border-b border-border/60 bg-muted/30 flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-primary" />
        <span className="font-semibold text-sm">In-trip chat</span>
      </div>

      <div className="h-72 overflow-y-auto p-4 space-y-2 bg-gradient-to-b from-card to-muted/20">
        {(list.data ?? []).length === 0 && (
          <div className="text-center py-8 text-xs text-muted-foreground">No messages yet — say hi 👋</div>
        )}
        {(list.data ?? []).map((m) => {
          const mine = m.senderRole === senderRole;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm ${mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"}`}>
                <div className="leading-snug">{m.body}</div>
                <div className={`text-[10px] mt-0.5 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={listEnd} />
      </div>

      <div className="px-3 py-2 border-t border-border/60">
        <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1">
          <Sparkles className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          {quick.map((q) => (
            <button key={q} type="button" onClick={() => submit(q, true)}
              className="text-xs whitespace-nowrap px-2.5 py-1 rounded-full border border-border/60 bg-muted/50 hover:bg-muted text-foreground/80 hover:text-foreground transition-colors">
              {q}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); submit(body); }} className="flex items-center gap-2">
          <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type a message…" className="rounded-full" />
          <Button type="submit" disabled={!body.trim() || send.isPending} size="icon" className="rounded-full shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
