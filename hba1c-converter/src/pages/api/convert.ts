import { NextApiRequest, NextApiResponse } from 'next';
import { convertHbA1cToMmolMol, convertMmolMolToHbA1c } from '../../utils/conversion';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { value, type } = req.body;

        let result;

        if (type === 'hba1cToMmolMol') {
            result = convertHbA1cToMmolMol(value);
        } else if (type === 'mmolMolToHbA1c') {
            result = convertMmolMolToHbA1c(value);
        } else {
            return res.status(400).json({ error: 'Invalid conversion type' });
        }

        return res.status(200).json({ result });
    } else {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}