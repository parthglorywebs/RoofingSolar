import axios from 'axios';
import {getLoginDetails} from '../utils/AsyncStorage';
import config from '../config/config';

export const fetchComments = async projectId => {
  try {
    const {access_token, contractor_id} = await getLoginDetails();

    const response = await axios.post(
      `${config.baseUrl}contractor/get-comment-board`,
      {
        contractor_id: contractor_id,
        project_id: projectId,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access_token}`,
        },
      },
    );
    const sources = response.data;
    const commentList = sources.data?.commentList ?? [];

    if (commentList?.length > 0) {
      return processComments(commentList);
    }

    return [];
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};

export const postComment = async commentData => {
  try {
    const {access_token} = await getLoginDetails();

    const formData = new FormData();
    Object.keys(commentData).forEach(key => {
      if (commentData[key] !== undefined) {
        formData.append(key, commentData[key]);
      }
    });

    const response = await axios.post(
      `${config.baseUrl}contractor/add-comment-board`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${access_token}`,
        },
      },
    );

    const data = response.data;

    if (data && data.success && data.data.original.success) {
      return {
        id: String(data.data.original.data.id),
        text: data.data.original.data.text,
        contractor_id: data.data.original.data.contractor_id,
        contractor_name:
          data.data.original.data.contractor_name ||
          data.data.original.data.name,
        created_at: data.data.original.data.created_at,
        created_at_human: data.data.original.data.created_at_human,
        parent_id: data.data.original.data.parent_id,
        children: [],
        role: data.data.original.data.role || 'contractor',
        name: data.data.original.data.name,
        email: data.data.original.data.email,
        filePath: data.data.original.data.filePath,
        c_profile_image: data.data.original.data.c_profile_image,
        u_profile_image: data.data.original.data.u_profile_image,
        project_id: data.data.original.data.project_id,
      };
    }

    throw new Error('Failed to post comment');
  } catch (error) {
    console.error('Error posting comment:', error);
    throw error;
  }
};

function processComments(comments) {
  const processedComments = [];

  comments.forEach(comment => {
    const processedComment = {
      id: String(comment.id),
      text: comment.text,
      contractor_id: comment.contractor_id,
      contractor_name: comment.contractor_name,
      created_at: comment.created_at,
      created_at_human: comment.created_at_human,
      parent_id: comment.parent_id,
      children: [],
      role: comment.role,
      name: comment.name,
      email: comment.email,
      filePath: comment.filePath,
      c_profile_image: comment.c_profile_image,
      u_profile_image: comment.u_profile_image,
      project_id: comment.project_id,
      created_at_human: comment.created_at_human,
    };

    if (
      comment.children &&
      Array.isArray(comment.children) &&
      comment.children.length > 0
    ) {
      processedComment.children = processComments(comment.children);
    }

    processedComments.push(processedComment);
  });

  return processedComments;
}

export const getPresignedUrls = async (file, project_id) => {
  try {
    const {access_token} = await getLoginDetails();
    const formData = new FormData();
    formData.append('project_id', project_id);
    formData.append('filename', file.fileName);
    formData.append('type', file.type);

    const {data} = await axios.post(
      `${config.baseUrl}contractor/get-presinged-urls`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${access_token}`,
        },
      },
    );

    const urls = data?.presigned_urls || [];
    if (!urls.length) {
      throw new Error('No presigned URLs returned');
    }

    return urls;
  } catch (error) {
    console.error('❌ Error getting presigned URLs:', error.response);
    throw error; // Let the upload function handle this
  }
};

export const uploadToS3 = async (url, fileUri, mimeType) => {
  try {
    const blob = await fetch(fileUri).then(res => res.blob());
    const result = await fetch(url, {
      method: 'PUT',
      headers: {'Content-Type': mimeType},
      body: blob,
    });

    if (!result.ok)
      throw new Error(`Upload failed with status ${result.status}`);
    return url;
  } catch (error) {
    console.error('❌ Upload error:', error);
    return null;
  }
};
