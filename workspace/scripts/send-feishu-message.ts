import axios from 'axios';
import * as fs from 'fs';

// 配置
const FEISHU_API_BASE = 'https://open.feishu.cn/open-apis';
const USER_OPEN_ID = 'ou_2b86a553050ad3a4aa425b031d8bab1e'; // Jialu的open_id

// 获取access token（从环境变量或文件）
async function getAccessToken(): Promise<string> {
    // 从环境变量获取
    const token = process.env.FEISHU_ACCESS_TOKEN;
    if (token) return token;
    
    // 或者从文件读取
    try {
        const tokenFile = '/tmp/feishu_token.txt';
        if (fs.existsSync(tokenFile)) {
            return fs.readFileSync(tokenFile, 'utf-8').trim();
        }
    } catch (e) {
        console.error('读取token文件失败:', e);
    }
    
    throw new Error('找不到飞书access token，请设置FEISHU_ACCESS_TOKEN环境变量');
}

// 发送飞书消息
async function sendFeishuMessage(content: string): Promise<void> {
    const accessToken = await getAccessToken();
    
    const url = `${FEISHU_API_BASE}/im/v1/messages?receive_id_type=open_id`;
    
    const messageContent = JSON.stringify({
        text: content
    });
    
    const body = {
        receive_id: USER_OPEN_ID,
        msg_type: 'text',
        content: messageContent
    };
    
    try {
        const response = await axios.post(url, body, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.data.code === 0) {
            console.log('消息发送成功');
        } else {
            console.error('消息发送失败:', response.data);
            throw new Error(`发送失败: ${response.data.msg}`);
        }
    } catch (error) {
        console.error('发送消息出错:', error);
        throw error;
    }
}

// 主函数
async function main() {
    // 从命令行参数获取要发送的消息文件路径
    const messageFile = process.argv[2];
    
    if (!messageFile) {
        console.error('用法: npx ts-node send-feishu-message.ts <消息文件路径>');
        process.exit(1);
    }
    
    if (!fs.existsSync(messageFile)) {
        console.error(`文件不存在: ${messageFile}`);
        process.exit(1);
    }
    
    const content = fs.readFileSync(messageFile, 'utf-8');
    
    // 飞书文本消息有长度限制，如果太长需要分段
    const MAX_LENGTH = 4000;
    if (content.length > MAX_LENGTH) {
        // 分段发送
        const chunks = [];
        for (let i = 0; i < content.length; i += MAX_LENGTH) {
            chunks.push(content.slice(i, i + MAX_LENGTH));
        }
        
        console.log(`内容过长，将分为${chunks.length}段发送`);
        
        for (let i = 0; i < chunks.length; i++) {
            const prefix = chunks.length > 1 ? `[${i + 1}/${chunks.length}]\n` : '';
            await sendFeishuMessage(prefix + chunks[i]);
            // 避免触发频率限制
            if (i < chunks.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
    } else {
        await sendFeishuMessage(content);
    }
}

main().catch(console.error);
