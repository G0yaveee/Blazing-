export default function PostComposer({
  isOwner,
  ownerLabel,
  tasks,
  selectedTaskId,
  onSelectedTaskIdChange,
  submittingPost,
  onSubmit,
  selectedPostFiles,
  onPostFileSelection,
  onRemoveSelectedPostFile,
  postCaption,
  onPostCaptionChange,
  postCaptionPlaceholder,
  selectedPreset,
  selectedPresetMeta,
  checkInPresets,
  onApplyPreset,
  onReuseLastCaption,
  canReuseLastCaption,
  postSubmitStage,
  getGoalTitle,
  formatTaskTypeLabel,
}) {
  if (!isOwner) {
    return (
      <div className="rounded-box border border-base-300/45 bg-base-100/55 p-4 text-base-content/75">
        Only {ownerLabel} can post proof. Everyone else can comment and verify it.
      </div>
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-4 rounded-box border border-base-300/45 bg-base-100 p-4"
    >
      <label className="grid gap-2">
        <span className="text-sm font-medium text-base-content">Routine</span>
        <select
          value={selectedTaskId}
          onChange={(event) => onSelectedTaskIdChange(event.target.value)}
          className="select select-bordered w-full bg-base-100"
          disabled={!tasks.length || submittingPost}
        >
          <option value="">Select routine</option>
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.title}
              {task.goal ? ` -> ${getGoalTitle(task.goal)}` : ""}
              {` (${formatTaskTypeLabel(task.type)})`}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-3 rounded-[1rem] border border-dashed border-base-300/45 bg-base-100/70 px-4 py-5">
        <div>
          <p className="text-sm font-medium text-base-content">Images</p>
          <p className="mt-2 text-sm text-base-content/70">
            Add optional proof images. You can choose more than one.
          </p>
        </div>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={onPostFileSelection}
          className="file-input file-input-bordered w-full bg-base-100"
          disabled={submittingPost}
        />
        {selectedPostFiles.length > 0 ? (
          <div className="grid gap-3">
            {selectedPostFiles.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col items-start gap-3 rounded-[0.9rem] border border-base-300/45 bg-base-100/85 px-3 py-3 sm:flex-row sm:items-center"
              >
                <img
                  src={entry.previewUrl}
                  alt={entry.file.name}
                  className="h-14 w-14 rounded-[0.8rem] object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-base-content">
                    {entry.file.name}
                  </p>
                  <p className="text-xs text-base-content/60">
                    {(entry.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveSelectedPostFile(entry.id)}
                  className="btn btn-ghost btn-sm"
                  disabled={submittingPost}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-base-content">Caption</span>
        <textarea
          value={postCaption}
          onChange={(event) => onPostCaptionChange(event.target.value)}
          className="textarea textarea-bordered min-h-32 w-full bg-base-100"
          placeholder={postCaptionPlaceholder}
          disabled={submittingPost}
        />
      </label>

      <div className="grid gap-3 rounded-[1rem] border border-base-300/45 bg-base-100/70 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-base-content">Special states</p>
          {selectedPreset ? (
            <span className="badge badge-outline">
              {selectedPresetMeta?.label}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {checkInPresets.map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => onApplyPreset(preset)}
              className={`btn btn-sm ${selectedPreset === preset.key ? "btn-primary" : "btn-outline"}`}
            >
              {preset.label}
            </button>
          ))}
          <button
            type="button"
            onClick={onReuseLastCaption}
            className="btn btn-sm btn-ghost"
            disabled={!canReuseLastCaption}
          >
            Use previous caption
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-base-content/65">
        <span>
          {postSubmitStage === "uploading"
            ? "Uploading images..."
            : postSubmitStage === "saving"
              ? "Publishing check-in..."
              : postCaption.trim()
                ? "Draft saved automatically"
                : "Start typing to save a draft"}
        </span>
      </div>
      <button
        type="submit"
        className="btn btn-primary w-full justify-self-stretch sm:btn-wide sm:w-auto sm:justify-self-start"
        disabled={!selectedTaskId || submittingPost}
      >
        {postSubmitStage === "uploading"
          ? "Uploading..."
          : postSubmitStage === "saving"
            ? "Publishing..."
            : "Publish check-in"}
      </button>
    </form>
  )
}
