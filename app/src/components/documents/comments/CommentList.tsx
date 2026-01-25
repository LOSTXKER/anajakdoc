"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageCircle,
  MoreHorizontal,
  Reply,
  Edit,
  Trash2,
  Loader2,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import {
  createComment,
  updateComment,
  deleteComment,
  type CommentData,
} from "@/server/actions/comment";

interface CommentItemProps {
  comment: CommentData;
  currentUserId: string;
  isAdmin: boolean;
  onReply: (commentId: string) => void;
  onDeleted: (commentId: string) => void;
  onUpdated: (comment: CommentData) => void;
  depth?: number;
}

function CommentItem({
  comment,
  currentUserId,
  isAdmin,
  onReply,
  onDeleted,
  onUpdated,
  depth = 0,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [loading, setLoading] = useState(false);

  const isAuthor = comment.user.id === currentUserId;
  const canEdit = isAuthor;
  const canDelete = isAuthor || isAdmin;

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    setLoading(true);
    try {
      const result = await updateComment(comment.id, editContent);
      if (result.success && result.data) {
        onUpdated(result.data);
        setIsEditing(false);
        toast.success("แก้ไขความคิดเห็นแล้ว");
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("ต้องการลบความคิดเห็นนี้?")) return;
    setLoading(true);
    try {
      const result = await deleteComment(comment.id);
      if (result.success) {
        onDeleted(comment.id);
        toast.success("ลบความคิดเห็นแล้ว");
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  return (
    <div className={`flex gap-3 ${depth > 0 ? "ml-8 mt-3" : ""}`}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={comment.user.avatarUrl || undefined} />
        <AvatarFallback className="text-xs">
          {getInitials(comment.user.name, comment.user.email)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">
            {comment.user.name || comment.user.email}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.createdAt), {
              addSuffix: true,
              locale: th,
            })}
          </span>
          {comment.editedAt && (
            <span className="text-xs text-muted-foreground">(แก้ไขแล้ว)</span>
          )}
        </div>

        {isEditing ? (
          <div className="mt-2 space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={2}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleEdit}
                disabled={loading || !editContent.trim()}
              >
                {loading && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                บันทึก
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
              >
                ยกเลิก
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm mt-1 whitespace-pre-wrap break-words">
              {comment.content}
            </p>

            <div className="flex items-center gap-2 mt-2">
              {depth < 2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => onReply(comment.id)}
                >
                  <Reply className="h-3 w-3 mr-1" />
                  ตอบกลับ
                </Button>
              )}

              {(canEdit || canDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {canEdit && (
                      <DropdownMenuItem onClick={() => setIsEditing(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        แก้ไข
                      </DropdownMenuItem>
                    )}
                    {canDelete && (
                      <DropdownMenuItem
                        onClick={handleDelete}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        ลบ
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </>
        )}

        {/* Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3 border-l-2 border-muted pl-3">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                onReply={onReply}
                onDeleted={onDeleted}
                onUpdated={onUpdated}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface CommentListProps {
  boxId: string;
  comments: CommentData[];
  currentUserId: string;
  isAdmin: boolean;
}

export function CommentList({
  boxId,
  comments: initialComments,
  currentUserId,
  isAdmin,
}: CommentListProps) {
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const result = await createComment({
        boxId,
        content: newComment,
        isInternal: false,
        parentId: replyingTo || undefined,
      });

      if (result.success && result.data) {
        const newCommentData = result.data;
        if (replyingTo) {
          // Add reply to parent comment
          setComments((prev) =>
            prev.map((c) => {
              if (c.id === replyingTo) {
                return { ...c, replies: [...c.replies, newCommentData] };
              }
              // Check nested replies
              return {
                ...c,
                replies: c.replies.map((r) =>
                  r.id === replyingTo
                    ? { ...r, replies: [...r.replies, newCommentData] }
                    : r
                ),
              };
            })
          );
        } else {
          // Add new top-level comment
          setComments((prev) => [newCommentData, ...prev]);
        }

        setNewComment("");
        setReplyingTo(null);
        toast.success("เพิ่มความคิดเห็นแล้ว");
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleted = (commentId: string) => {
    setComments((prev) =>
      prev
        .filter((c) => c.id !== commentId)
        .map((c) => ({
          ...c,
          replies: c.replies
            .filter((r) => r.id !== commentId)
            .map((r) => ({
              ...r,
              replies: r.replies.filter((rr) => rr.id !== commentId),
            })),
        }))
    );
  };

  const handleUpdated = (updated: CommentData) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === updated.id) return { ...c, ...updated };
        return {
          ...c,
          replies: c.replies.map((r) =>
            r.id === updated.id
              ? { ...r, ...updated }
              : {
                  ...r,
                  replies: r.replies.map((rr) =>
                    rr.id === updated.id ? { ...rr, ...updated } : rr
                  ),
                }
          ),
        };
      })
    );
  };

  const replyingToComment = replyingTo
    ? comments.find((c) => c.id === replyingTo) ||
      comments.flatMap((c) => c.replies).find((r) => r.id === replyingTo)
    : null;

  return (
    <div className="space-y-4">
      {/* Comment Input */}
      <div className="space-y-3">
        {replyingTo && replyingToComment && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
            <Reply className="h-4 w-4" />
            <span>
              ตอบกลับ {replyingToComment.user.name || replyingToComment.user.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 ml-auto"
              onClick={() => setReplyingTo(null)}
            >
              ยกเลิก
            </Button>
          </div>
        )}

        <div className="flex gap-3">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={replyingTo ? "เขียนคำตอบ..." : "เขียนความคิดเห็น..."}
            rows={2}
            className="flex-1"
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={loading || !newComment.trim()}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {replyingTo ? "ตอบกลับ" : "ส่ง"}
          </Button>
        </div>
      </div>

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>ยังไม่มีความคิดเห็น</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onReply={setReplyingTo}
              onDeleted={handleDeleted}
              onUpdated={handleUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
}
