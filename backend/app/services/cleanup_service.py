import os
import shutil


def delete_file(file_path):
    """
    Delete a single file.
    """

    try:

        if file_path and os.path.exists(file_path):
            os.remove(file_path)
            print(f"[Cleanup] Deleted file: {file_path}")

    except Exception as e:

        print(f"[Cleanup] Failed to delete file: {e}")


def delete_directory(directory_path):
    """
    Delete all files inside a directory.
    """

    try:

        if os.path.exists(directory_path):

            for item in os.listdir(directory_path):

                item_path = os.path.join(directory_path, item)

                if os.path.isfile(item_path):

                    os.remove(item_path)

                elif os.path.isdir(item_path):

                    shutil.rmtree(item_path)

            print(f"[Cleanup] Cleared directory: {directory_path}")

    except Exception as e:

        print(f"[Cleanup] Directory cleanup failed: {e}")


def cleanup_request_files(uploaded_files, temp_paths=None):
    """
    Cleanup uploaded request files and OCR temp files.
    """

    if uploaded_files:

        for file_path in uploaded_files:

            delete_file(file_path)

    if temp_paths:

        for temp in temp_paths:

            delete_file(temp)