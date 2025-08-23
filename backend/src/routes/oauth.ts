import express from 'express';
import { oauthService, OAuthProvider } from '@/services/oauthService';
import { asyncHandler } from '@/middleware/asyncHandler';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/validation';
import Joi from 'joi';
import { winstonLogger } from '@/middleware/logger';

const router = express.Router();

/**
 * 获取可用的OAuth提供商
 */
router.get('/providers',
  asyncHandler(async (req, res) => {
    const providers = oauthService.getAvailableProviders();
    
    res.json({
      success: true,
      message: '获取OAuth提供商成功',
      data: providers
    });
  })
);

/**
 * GitHub OAuth授权
 */
router.get('/github',
  asyncHandler(async (req, res) => {
    try {
      const { authUrl, state } = await oauthService.getAuthUrl(OAuthProvider.GITHUB);
      
      winstonLogger.info('GitHub OAuth授权发起', { state });
      
      res.redirect(authUrl);
    } catch (error) {
      winstonLogger.error('GitHub OAuth授权失败', { error: error.message });
      res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed&provider=github`);
    }
  })
);

/**
 * GitHub OAuth回调
 */
router.get('/github/callback',
  validate({
    query: Joi.object({
      code: Joi.string().required().messages({
        'string.empty': '授权码不能为空',
        'any.required': '授权码是必需的'
      }),
      state: Joi.string().required().messages({
        'string.empty': '状态参数不能为空',
        'any.required': '状态参数是必需的'
      }),
      error: Joi.string().optional(),
      error_description: Joi.string().optional()
    })
  }),
  asyncHandler(async (req, res) => {
    const { code, state, error, error_description } = req.query as any;
    
    try {
      // 检查是否有错误
      if (error) {
        winstonLogger.warn('GitHub OAuth授权被拒绝', { error, error_description });
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_denied&provider=github`);
      }
      
      // 处理OAuth回调
      const result = await oauthService.handleCallback(OAuthProvider.GITHUB, code, state);
      
      if (result.success) {
        // 设置JWT cookie
        res.cookie('token', result.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000 // 24小时
        });
        
        // 重定向到前端
        const redirectUrl = result.isNewUser 
          ? `${process.env.FRONTEND_URL}/welcome?oauth=github`
          : `${process.env.FRONTEND_URL}/dashboard?oauth=github`;
          
        res.redirect(redirectUrl);
      } else {
        res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed&provider=github`);
      }
    } catch (error) {
      winstonLogger.error('GitHub OAuth回调处理失败', { error: error.message });
      res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed&provider=github`);
    }
  })
);

/**
 * Google OAuth授权
 */
router.get('/google',
  asyncHandler(async (req, res) => {
    try {
      const { authUrl, state } = await oauthService.getAuthUrl(OAuthProvider.GOOGLE);
      
      winstonLogger.info('Google OAuth授权发起', { state });
      
      res.redirect(authUrl);
    } catch (error) {
      winstonLogger.error('Google OAuth授权失败', { error: error.message });
      res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed&provider=google`);
    }
  })
);

/**
 * Google OAuth回调
 */
router.get('/google/callback',
  validate({
    query: Joi.object({
      code: Joi.string().required().messages({
        'string.empty': '授权码不能为空',
        'any.required': '授权码是必需的'
      }),
      state: Joi.string().required().messages({
        'string.empty': '状态参数不能为空',
        'any.required': '状态参数是必需的'
      }),
      error: Joi.string().optional(),
      error_description: Joi.string().optional()
    })
  }),
  asyncHandler(async (req, res) => {
    const { code, state, error, error_description } = req.query as any;
    
    try {
      if (error) {
        winstonLogger.warn('Google OAuth授权被拒绝', { error, error_description });
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_denied&provider=google`);
      }
      
      const result = await oauthService.handleCallback(OAuthProvider.GOOGLE, code, state);
      
      if (result.success) {
        res.cookie('token', result.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000
        });
        
        const redirectUrl = result.isNewUser 
          ? `${process.env.FRONTEND_URL}/welcome?oauth=google`
          : `${process.env.FRONTEND_URL}/dashboard?oauth=google`;
          
        res.redirect(redirectUrl);
      } else {
        res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed&provider=google`);
      }
    } catch (error) {
      winstonLogger.error('Google OAuth回调处理失败', { error: error.message });
      res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed&provider=google`);
    }
  })
);

/**
 * Gitee OAuth授权
 */
router.get('/gitee',
  asyncHandler(async (req, res) => {
    try {
      const { authUrl, state } = await oauthService.getAuthUrl(OAuthProvider.GITEE);
      
      winstonLogger.info('Gitee OAuth授权发起', { state });
      
      res.redirect(authUrl);
    } catch (error) {
      winstonLogger.error('Gitee OAuth授权失败', { error: error.message });
      res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed&provider=gitee`);
    }
  })
);

/**
 * Gitee OAuth回调
 */
router.get('/gitee/callback',
  validate({
    query: Joi.object({
      code: Joi.string().required().messages({
        'string.empty': '授权码不能为空',
        'any.required': '授权码是必需的'
      }),
      state: Joi.string().required().messages({
        'string.empty': '状态参数不能为空',
        'any.required': '状态参数是必需的'
      }),
      error: Joi.string().optional(),
      error_description: Joi.string().optional()
    })
  }),
  asyncHandler(async (req, res) => {
    const { code, state, error, error_description } = req.query as any;
    
    try {
      if (error) {
        winstonLogger.warn('Gitee OAuth授权被拒绝', { error, error_description });
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_denied&provider=gitee`);
      }
      
      const result = await oauthService.handleCallback(OAuthProvider.GITEE, code, state);
      
      if (result.success) {
        res.cookie('token', result.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000
        });
        
        const redirectUrl = result.isNewUser 
          ? `${process.env.FRONTEND_URL}/welcome?oauth=gitee`
          : `${process.env.FRONTEND_URL}/dashboard?oauth=gitee`;
          
        res.redirect(redirectUrl);
      } else {
        res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed&provider=gitee`);
      }
    } catch (error) {
      winstonLogger.error('Gitee OAuth回调处理失败', { error: error.message });
      res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed&provider=gitee`);
    }
  })
);

/**
 * 解绑OAuth账号
 */
router.delete('/unlink/:provider',
  authenticate,
  validate({
    params: Joi.object({
      provider: Joi.string().valid(...Object.values(OAuthProvider)).required().messages({
        'any.only': '不支持的OAuth提供商',
        'any.required': 'OAuth提供商是必需的'
      })
    })
  }),
  asyncHandler(async (req, res) => {
    const { provider } = req.params;
    const userId = req.user.id;
    
    await oauthService.unlinkOAuth(userId, provider as OAuthProvider);
    
    res.json({
      success: true,
      message: `${provider} 账号解绑成功`
    });
  })
);

/**
 * 获取用户OAuth绑定状态
 */
router.get('/bindings',
  authenticate,
  asyncHandler(async (req, res) => {
    const providers = oauthService.getAvailableProviders();
    
    // 这里应该从数据库获取用户的OAuth绑定状态
    // 简化处理，返回可用的提供商列表
    const bindings = providers.map(provider => ({
      ...provider,
      bound: false // 这里应该查询数据库确定绑定状态
    }));
    
    res.json({
      success: true,
      message: '获取OAuth绑定状态成功',
      data: bindings
    });
  })
);

/**
 * OAuth登录状态检查
 */
router.get('/status',
  asyncHandler(async (req, res) => {
    const providers = oauthService.getAvailableProviders();
    const availableProviders = providers.filter(p => p.configured);
    
    res.json({
      success: true,
      message: '获取OAuth状态成功',
      data: {
        enabled: availableProviders.length > 0,
        providers: availableProviders
      }
    });
  })
);

export default router;