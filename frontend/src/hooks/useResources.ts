import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Resource, SearchFilters, CreateResourceRequest, UpdateResourceRequest } from '../types';
import { resourceService } from '../services/api';

/**
 * 资源数据管理Hook
 * 提供资源的CRUD操作和数据获取功能
 */
export const useResources = () => {
  const queryClient = useQueryClient();

  // 获取资源列表
  const useResourceList = (filters?: SearchFilters, page: number = 1, limit: number = 20) => {
    return useQuery({
      queryKey: ['resources', filters, page, limit],
      queryFn: () => resourceService.getResources(filters, page, limit),
      placeholderData: keepPreviousData,
      staleTime: 5 * 60 * 1000, // 5分钟
    });
  };

  // 获取单个资源详情
  const useResourceDetail = (id: string) => {
    return useQuery({
      queryKey: ['resource', id],
      queryFn: () => resourceService.getResource(id),
      staleTime: 2 * 60 * 1000, // 2分钟
    });
  };

  // 获取用户资源
  const useUserResources = (userId: string, page: number = 1, limit: number = 20) => {
    return useQuery({
      queryKey: ['user-resources', userId, page, limit],
      queryFn: () => resourceService.getUserResources(userId, page, limit),
      enabled: !!userId,
    });
  };

  // 搜索资源
  const useResourceSearch = (keyword: string, filters?: SearchFilters, page: number = 1, limit: number = 20) => {
    return useQuery({
      queryKey: ['resource-search', keyword, filters, page, limit],
      queryFn: () => resourceService.searchResources(keyword, filters, page, limit),
      enabled: !!keyword,
      placeholderData: keepPreviousData,
    });
  };

  // 获取热门资源
  const usePopularResources = (limit: number = 10) => {
    return useQuery({
      queryKey: ['popular-resources', limit],
      queryFn: () => resourceService.getPopularResources(limit),
      staleTime: 10 * 60 * 1000, // 10分钟
    });
  };

  // 获取推荐资源
  const useRecommendedResources = (limit: number = 10) => {
    return useQuery({
      queryKey: ['recommended-resources', limit],
      queryFn: () => resourceService.getRecommendedResources(limit),
      staleTime: 10 * 60 * 1000, // 10分钟
    });
  };

  // 创建资源mutation
  const createResourceMutation = useMutation({
    mutationFn: (data: CreateResourceRequest) => resourceService.createResource(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['user-resources'] });
    },
  });

  // 更新资源mutation
  const updateResourceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateResourceRequest }) => resourceService.updateResource(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['resource', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['user-resources'] });
    },
  });

  // 删除资源mutation
  const deleteResourceMutation = useMutation({
    mutationFn: (id: string) => resourceService.deleteResource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['user-resources'] });
    },
  });

  return {
    useResourceList,
    useResourceDetail,
    useUserResources,
    useResourceSearch,
    usePopularResources,
    useRecommendedResources,
    createResource: createResourceMutation,
    updateResource: updateResourceMutation,
    deleteResource: deleteResourceMutation,
  };
};

/**
 * 单个资源Hook
 * 用于管理单个资源的状态和操作
 */
export const useResource = (id: string) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  // 获取资源详情
  const { data: resource, isLoading, error } = useQuery({
    queryKey: ['resource', id],
    queryFn: () => resourceService.getResource(id),
    enabled: !!id,
  });

  // 更新资源mutation
  const updateResourceMutation = useMutation({
    mutationFn: (data: UpdateResourceRequest) => resourceService.updateResource(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resource', id] });
      setIsEditing(false);
    },
  });

  // 删除资源mutation
  const deleteResourceMutation = useMutation({
    mutationFn: () => resourceService.deleteResource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['user-resources'] });
    },
  });

  return {
    resource: resource?.data,
    isLoading,
    error,
    isEditing,
    setIsEditing,
    updateResource: updateResourceMutation,
    deleteResource: deleteResourceMutation,
  };
};