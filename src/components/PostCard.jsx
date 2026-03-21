import { useState } from "react"
import { createPortal } from "react-dom"

export default function PostCard(props) {
  const {
    post,
    comments,
    postsLength,
    activeFeedIndex,
    onPrevious,
    onNext,
    themeCardClass,
    getGoalTitle,
    getAuthorLabel,
    formatDate,
    formatTaskTypeLabel,
    getOrderedPostImages,
    reviewDecisions,
    onReviewDecisionChange,
    commentDraft,
    onCommentDraftChange,
    onCommentSubmit,
    submittingCommentFor,
    extractReviewDecision,
  } = props
  const galleryImages = getOrderedPostImages(post)
  const [activeImageIndex, setActiveImageIndex] = useState(-1)
  const activeImage = activeImageIndex >= 0 ? galleryImages[activeImageIndex] : null

  function closeLightbox() {
    setActiveImageIndex(-1)
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPrevious}
          className="btn btn-outline btn-sm"
          aria-label="Show previous check-in"
          disabled={postsLength <= 1}
        >
          ←
        </button>
        <p className="text-sm uppercase tracking-[0.16em] text-base-content/58">
          {activeFeedIndex + 1} / {postsLength}
        </p>
        <button
          type="button"
          onClick={onNext}
          className="btn btn-outline btn-sm"
          aria-label="Show next check-in"
          disabled={postsLength <= 1}
        >
          →
        </button>
      </div>

      <article
        key={post.id}
        className={`${themeCardClass} rounded-[1.6rem] border border-base-300/40`}
      >
        <div className="grid gap-5 p-4 sm:p-5">
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <props.AvatarComponent
                  profile={post.author}
                  sizeClass="h-11 w-11"
                  textClass="text-sm"
                  backgroundClass="bg-base-100"
                />
                <div className="min-w-0">
                  <h3 className="brand-heading text-2xl text-base-content">
                    {post.task?.title || "Untitled task"}
                  </h3>
                  {post.task?.goal ? (
                    <p className="mt-1 text-sm text-base-content/68">
                      Goal: {getGoalTitle(post.task.goal)}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm uppercase tracking-[0.18em] text-base-content/60">
                    {getAuthorLabel(post.author)} • {formatDate(post.created_at)}
                  </p>
                </div>
              </div>
              {post.task?.type ? (
                <span className="badge badge-outline uppercase">
                  {formatTaskTypeLabel(post.task.type)}
                </span>
              ) : null}
            </div>

            <p className="leading-8 text-base-content/85">
              {post.caption || "No caption provided."}
            </p>

            {galleryImages.length > 0 ? (
              <div
                className={`grid gap-3 ${
                  galleryImages.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
                }`}
              >
                {galleryImages.map((image, index) => (
                  <div
                    key={image.id || image.public_id || `${post.id}-${index}`}
                    className={`overflow-hidden rounded-[1.2rem] border border-base-300/45 bg-base-100/38 ${
                      galleryImages.length === 1 ? "max-h-[28rem]" : "max-h-72"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveImageIndex(index)}
                      className="block h-full w-full cursor-zoom-in"
                      aria-label="Open image full size"
                    >
                      <img
                        src={image.image_url}
                        alt={post.caption || post.task?.title || "Post image"}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="hex-feed-panel rounded-box border border-dashed border-base-300/45 bg-base-100/38 p-4 text-sm text-base-content/65">
                No images attached to this check-in.
              </div>
            )}
          </div>

          <div className="hex-feed-panel rounded-[1.2rem] border border-base-300/45 bg-base-100/58 p-4">
            <p className="mb-3 text-sm uppercase tracking-[0.18em] text-secondary">
              Review and discussion
            </p>

            <form onSubmit={onCommentSubmit} className="grid gap-3">
              <div className="grid gap-2">
                <p className="text-sm font-semibold text-base-content">
                  Is this enough proof?
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={`btn btn-sm ${
                      reviewDecisions[post.id] === "yes"
                        ? "btn-success"
                        : "btn-outline"
                    }`}
                    onClick={() => onReviewDecisionChange(post.id, "yes")}
                    disabled={submittingCommentFor === post.id}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${
                      reviewDecisions[post.id] === "no"
                        ? "btn-warning"
                        : "btn-outline"
                    }`}
                    onClick={() => onReviewDecisionChange(post.id, "no")}
                    disabled={submittingCommentFor === post.id}
                  >
                    No
                  </button>
                </div>
              </div>
              {reviewDecisions[post.id] ? (
                <div className={`rounded-[1rem] border px-4 py-3 ${
                  reviewDecisions[post.id] === "yes"
                    ? "border-success/30 bg-success/10"
                    : "border-warning/30 bg-warning/12"
                }`}>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-base-content/55">
                    Enough proof
                  </p>
                  <div className="mt-2">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
                      reviewDecisions[post.id] === "yes"
                        ? "bg-success/18 text-success"
                        : "bg-warning/22 text-warning"
                    }`}>
                      {reviewDecisions[post.id] === "yes" ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              ) : null}
              <textarea
                value={commentDraft}
                onChange={(event) => onCommentDraftChange(post.id, event.target.value)}
                className="textarea textarea-bordered min-h-24 w-full bg-base-100"
                placeholder="Leave a comment for the check-in."
                disabled={submittingCommentFor === post.id}
              />
              <button
                type="submit"
                className="btn btn-secondary w-full justify-self-stretch sm:w-auto sm:justify-self-start"
                disabled={
                  !reviewDecisions[post.id] ||
                  submittingCommentFor === post.id
                }
              >
                {submittingCommentFor === post.id ? "Sending..." : "Send"}
              </button>
            </form>

            {comments.length === 0 ? (
              <p className="text-base-content/68">
                No comments yet. This check-in still needs review.
              </p>
            ) : (
              <div className="max-h-56 space-y-3 overflow-auto pr-1">
                {comments.map((comment) => {
                  const reviewMeta = extractReviewDecision(comment.content)
                  return (
                    <div
                      key={comment.id}
                      className="rounded-box bg-base-100/85 px-4 py-3"
                    >
                      <div className="flex items-start gap-3">
                        <props.AvatarComponent
                          profile={comment.author}
                          sizeClass="h-10 w-10"
                          textClass="text-xs"
                          backgroundClass="bg-base-200"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                              <span className="font-semibold text-base-content">
                                {getAuthorLabel(comment.author)}
                              </span>
                              <span className="text-base-content/50">
                                {formatDate(comment.created_at)}
                              </span>
                            </div>
                            {reviewMeta.decision ? (
                              <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                                reviewMeta.decision === "yes"
                                  ? "border-success/25 bg-success/14 text-success"
                                  : "border-warning/25 bg-warning/16 text-warning"
                              }`}>
                                {reviewMeta.decision === "yes" ? "Yes" : "No"}
                              </span>
                            ) : null}
                          </div>
                          {reviewMeta.body ? (
                            <p className="text-base-content/80">
                              {reviewMeta.body}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </article>

      {activeImage
        ? createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={closeLightbox}
          role="presentation"
        >
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute right-4 top-4 btn btn-circle btn-sm border-none bg-base-100/90 text-base-content"
            aria-label="Close full size image"
          >
            x
          </button>
          <div
            className="max-h-[90vh] max-w-[90vw] overflow-hidden rounded-[1.2rem] border border-base-100/20 bg-black/20 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            role="presentation"
          >
            <img
              src={activeImage.image_url}
              alt={post.caption || post.task?.title || "Post image"}
              className="max-h-[90vh] max-w-[90vw] object-contain"
            />
          </div>
        </div>
          ,
          document.body
        )
        : null}
    </div>
  )
}
